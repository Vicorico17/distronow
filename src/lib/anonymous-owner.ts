import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "distronow_anonymous_owner";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

function cookieOptions() {
  return {
    httpOnly: true,
    maxAge: MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production"
  };
}

export async function getAnonymousOwnerId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;

  return value?.trim() || null;
}

export async function getOrCreateAnonymousOwnerId() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;

  if (existing?.trim()) {
    return existing;
  }

  const next = crypto.randomUUID();

  cookieStore.set(COOKIE_NAME, next, cookieOptions());

  return next;
}
