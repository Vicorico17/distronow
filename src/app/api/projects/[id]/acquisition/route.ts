import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { getBrandProjectWorkspace } from "@/lib/brand-store";
import {
  actionSchema,
  applyAction,
  assertSendable,
  logEvent,
} from "@/lib/acquisition";
import {
  acquisitionConnections,
  discoverBuyers,
  enrichBuyer,
  generateOutreach,
  sendOutreach,
} from "@/lib/acquisition-providers";
import { readAcquisition, writeAcquisition } from "@/lib/acquisition-store";

export const runtime = "nodejs";
export const maxDuration = 120;
type Context = { params: Promise<{ id: string }> };
async function authorize(id: string) {
  const user = await getCurrentUser();
  const workspace = await getBrandProjectWorkspace(
    id,
    user?.id,
    await getAnonymousOwnerId(),
  );
  return { workspace, user };
}
export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { workspace, user } = await authorize(id);
    if (!workspace)
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    return NextResponse.json(
      {
        ...(await readAcquisition(id)),
        connections: acquisitionConnections(user?.id),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load acquisition.",
      },
      { status: 503 },
    );
  }
}
export async function POST(request: Request, context: Context) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    const raw = await request.text();
    if (raw.length > 40000)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const body = JSON.parse(raw);
    const action = actionSchema.parse(body);
    const { id } = await context.params;
    const { workspace, user } = await authorize(id);
    if (!workspace)
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 },
      );
    const snapshot = await readAcquisition(id);
    if ((snapshot.version ?? null) !== (body.version ?? null))
      return NextResponse.json(
        {
          error:
            "Another session changed this workspace. Refresh to see the latest version.",
        },
        { status: 409 },
      );
    const isProvider = ["discover", "enrich", "send", "draft"].includes(
      action.action,
    );
    if (isProvider && !user)
      return NextResponse.json(
        {
          error:
            "Log in and claim this project before using connected providers.",
        },
        { status: 403 },
      );
    if (snapshot.status === "busy") {
      const stale =
        snapshot.version && Date.now() - Date.parse(snapshot.version) > 150000;
      if (!stale)
        return NextResponse.json(
          { error: "An operation is running. Refresh shortly." },
          { status: 409 },
        );
      // Never automatically retry an interrupted send. Its saved 'sending' state needs mailbox reconciliation.
    }
    const brand = {
      name: workspace.latestExtraction.title || workspace.project.domain,
      description: workspace.latestExtraction.description || "",
      website: workspace.project.websiteUrl,
      audience: workspace.project.audience || "",
    };
    if (!isProvider) {
      const state = applyAction(snapshot.state, action, brand);
      const version = await writeAcquisition(id, state, snapshot.version);
      return NextResponse.json({
        state,
        version,
        status: "ready",
        connections: acquisitionConnections(user?.id),
      });
    }
    let state = structuredClone(snapshot.state);
    const prospect =
      "prospectId" in action
        ? state.prospects.find((p) => p.id === action.prospectId)
        : undefined;
    if ("prospectId" in action && !prospect)
      throw new Error("Buyer not found.");
    if (
      prospect &&
      (prospect.status === "suppressed" ||
        ["sending", "uncertain", "sent"].includes(prospect.draftStatus))
    )
      throw new Error("This buyer cannot receive another outbound action.");
    const campaign = state.campaigns.find(
      (c) =>
        c.id ===
        ("campaignId" in action ? action.campaignId : prospect?.campaignId),
    );
    if (!campaign) throw new Error("Campaign not found.");
    if (action.action === "send") {
      assertSendable(state, prospect!);
      if (!acquisitionConnections(user?.id).sending)
        throw new Error(
          "Connect the outbound mailbox and authorize this account to send first.",
        );
      prospect!.draftStatus = "sending";
      logEvent(
        state,
        campaign.id,
        prospect!.id,
        "send_started",
        "Mailbox submission started; do not retry until reconciled.",
      );
    }
    if (action.action === "draft") {
      state = applyAction(state, action, brand);
    }
    let version = await writeAcquisition(id, state, snapshot.version, "busy");
    const currentProspect = prospect
      ? state.prospects.find((p) => p.id === prospect.id)!
      : undefined;
    const currentCampaign = state.campaigns.find((c) => c.id === campaign.id)!;
    try {
      if (action.action === "discover")
        await discoverBuyers(state, currentCampaign, id);
      else if (action.action === "enrich")
        await enrichBuyer(state, currentProspect!, id);
      else if (action.action === "draft") {
        const generated = await generateOutreach(
          currentProspect!,
          currentCampaign,
          brand,
        );
        currentProspect!.subject = generated.subject;
        currentProspect!.body = generated.body;
        logEvent(
          state,
          campaign.id,
          currentProspect!.id,
          "draft_generated",
          `Draft generated with ${generated.provider}; review required.`,
          "provider",
        );
      } else if (action.action === "send") {
        const messageId = `<distronow-${currentProspect!.id}-${crypto.randomUUID()}@${process.env.OUTREACH_FROM!.split("@")[1]}>`;
        const confirmed = await sendOutreach(
          currentProspect!,
          messageId,
          user!.id,
        );
        currentProspect!.draftStatus = "sent";
        currentProspect!.status = "contacted";
        logEvent(
          state,
          campaign.id,
          currentProspect!.id,
          "email_sent",
          `Mailbox accepted ${confirmed}. Delivery is not yet confirmed.`,
          "provider",
        );
      }
    } catch (error) {
      if (action.action === "send") currentProspect!.draftStatus = "uncertain";
      if (action.action === "draft") {
        const previous = snapshot.state.prospects.find(
          (p) => p.id === currentProspect!.id,
        )!;
        currentProspect!.subject = previous.subject;
        currentProspect!.body = previous.body;
        currentProspect!.draftStatus = previous.draftStatus;
      }
      const message =
        error instanceof Error ? error.message : "Provider request failed.";
      logEvent(
        state,
        campaign.id,
        currentProspect?.id || "",
        "operation_failed",
        action.action === "send"
          ? "Send outcome uncertain. Check the Sent folder before reconciling."
          : message,
      );
      version = await writeAcquisition(id, state, version);
      return NextResponse.json(
        {
          state,
          version,
          status: "ready",
          connections: acquisitionConnections(user?.id),
          error:
            action.action === "send"
              ? "Send outcome uncertain. Check your mailbox and reconcile this message; it will not be retried automatically."
              : message,
        },
        { status: 502 },
      );
    }
    version = await writeAcquisition(id, state, version);
    return NextResponse.json({
      state,
      version,
      status: "ready",
      connections: acquisitionConnections(user?.id),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not update acquisition.",
      },
      { status: 400 },
    );
  }
}
