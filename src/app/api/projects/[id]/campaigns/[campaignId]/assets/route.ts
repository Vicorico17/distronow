import { NextResponse } from "next/server";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import {
  getBrandProjectWorkspace,
  getCampaign,
  saveMarketingAsset,
  savePostDrafts
} from "@/lib/brand-store";
import type { Json } from "@/lib/supabase/types";
import { CHANNELS, ContentChannel, ContentIntent, ContentLength, DraftGenerationSettings, GeneratedPostDraft } from "@/lib/post-generator";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/supabase/auth-server";

type CalendarItem = {
  day: number;
  channel: string;
  assetType: string;
  topic: string;
  hook: string;
  cta: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
    campaignId: string;
  }>;
};

function isJsonObject(value: Json | undefined): value is Record<string, Json> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readString(value: Json | undefined) {
  return typeof value === "string" ? value : "";
}

function readCalendar(settings: Json): CalendarItem[] {
  if (!isJsonObject(settings) || !Array.isArray(settings.calendar)) {
    return [];
  }

  return settings.calendar
    .map((entry, index): CalendarItem | null => {
      if (!isJsonObject(entry)) {
        return null;
      }

      return {
        day: typeof entry.day === "number" ? entry.day : index + 1,
        channel: readString(entry.channel),
        assetType: readString(entry.assetType) || "Campaign asset",
        topic: readString(entry.topic) || "Campaign topic",
        hook: readString(entry.hook) || "A sharper campaign post starts here.",
        cta: readString(entry.cta) || "Take the next step."
      };
    })
    .filter((item): item is CalendarItem => Boolean(item));
}

function normalizeChannel(channel: string): ContentChannel {
  return CHANNELS.includes(channel as ContentChannel) ? (channel as ContentChannel) : "LinkedIn";
}

function campaignDraft(item: CalendarItem): GeneratedPostDraft {
  const channel = normalizeChannel(item.channel);
  const settings: DraftGenerationSettings = {
    channel,
    intent: "Educational" as ContentIntent,
    language: "Auto",
    tone: "Auto",
    length: "Medium" as ContentLength,
    goal: item.topic,
    hook: item.hook
  };

  return {
    channel,
    intent: "Educational",
    language: "Auto",
    tone: "Auto",
    length: "Medium",
    headline: item.hook,
    body: [item.hook, item.topic].filter(Boolean).join("\n\n"),
    cta: item.cta,
    hashtags: ["#Campaign", `#Day${item.day}`],
    provider: "template",
    model: null,
    promptVersion: "campaign-assets-v1",
    settings
  };
}

export async function POST(request: Request, context: RouteContext) {
  const rateLimit = checkRateLimit({
    scope: "campaign-assets",
    key: getClientKey(request),
    limit: 20,
    windowMs: 60 * 60 * 1000
  });

  if (rateLimit.limited) {
    return NextResponse.json({ error: "Too many campaign asset requests. Try again later." }, { status: 429 });
  }

  const { id, campaignId } = await context.params;

  try {
    const user = await getCurrentUser();
    const anonymousOwnerId = await getAnonymousOwnerId();
    const workspace = await getBrandProjectWorkspace(id, user?.id, anonymousOwnerId);

    if (!workspace) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    const campaign = await getCampaign({ projectId: id, campaignId });
    const calendar = readCalendar(campaign.settings);

    if (!calendar.length) {
      return NextResponse.json({ error: "Campaign has no calendar items." }, { status: 400 });
    }

    const drafts = await savePostDrafts({
      projectId: id,
      brandExtractionId: workspace.latestExtraction.id,
      campaignId,
      drafts: calendar.map(campaignDraft),
      userId: workspace.project.userId
    });
    const assets = await Promise.all(
      calendar.map((item) =>
        saveMarketingAsset({
          projectId: id,
          userId: workspace.project.userId,
          brandExtractionId: workspace.latestExtraction.id,
          campaignId,
          audienceId: campaign.audienceId,
          assetType: item.assetType,
          title: `Day ${item.day}: ${item.topic}`,
          brief: campaign.objective,
          prompt: item.hook,
          content: {
            day: item.day,
            channel: item.channel,
            topic: item.topic,
            body: [item.hook, item.topic].join("\n\n"),
            cta: item.cta,
            visualDirection: `Create a ${item.assetType.toLowerCase()} for day ${item.day} of ${campaign.name}.`
          },
          provider: "campaign",
          model: null,
          settings: {
            campaignId,
            day: item.day,
            channel: item.channel
          }
        })
      )
    );

    return NextResponse.json({ drafts, assets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate campaign assets.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
