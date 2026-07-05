import { NextResponse } from "next/server";
import { getAnonymousOwnerId } from "@/lib/anonymous-owner";
import { claimAnonymousProjects } from "@/lib/brand-store";
import { getCurrentUser } from "@/lib/supabase/auth-server";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Log in before claiming projects." }, { status: 401 });
    }

    const anonymousOwnerId = await getAnonymousOwnerId();
    const claimed = await claimAnonymousProjects(user.id, anonymousOwnerId);

    return NextResponse.json({ claimed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not claim projects.";
    console.error(error);

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
