import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { BrandExtraction, getColorEntries } from "@/lib/brand";
import type { SavedBrandAudience } from "@/lib/brand-store";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const run = promisify(execFile);
const DEFAULT_TTS_MODEL = "gpt-4o-mini-tts";

function brandName(extraction: BrandExtraction) {
  return extraction.title?.split("|")[0].trim() || new URL(extraction.sourceUrl).hostname.replace(/^www\./, "");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function oneLine(value: string, limit: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function videoComposition({
  title,
  voiceover,
  cta,
  colors,
  logoUrl
}: {
  title: string;
  voiceover: string;
  cta: string;
  colors: string[];
  logoUrl?: string | null;
}) {
  const primary = colors[0] ?? "#2f6fed";
  const secondary = colors[1] ?? "#111827";
  const accent = colors[2] ?? "#f8fafc";
  const safeLogo = logoUrl ? escapeHtml(logoUrl) : "";

  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1080px; height: 1920px; overflow: hidden; font-family: Arial, sans-serif; }
  #video { position: relative; width: 1080px; height: 1920px; overflow: hidden; color: white; background: linear-gradient(150deg, ${primary}, ${secondary}); }
  .orb { position: absolute; border-radius: 999px; opacity: .38; filter: blur(2px); }
  .orb-one { width: 780px; height: 780px; background: ${accent}; top: -260px; right: -240px; animation: drift 8s ease-in-out infinite alternate; }
  .orb-two { width: 680px; height: 680px; background: ${primary}; bottom: -260px; left: -260px; animation: drift 7s ease-in-out infinite alternate-reverse; }
  .content { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 112px 84px 128px; }
  .brand { display: flex; align-items: center; gap: 24px; font-size: 30px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .logo { width: 64px; height: 64px; border-radius: 16px; object-fit: contain; background: rgba(255,255,255,.95); padding: 8px; }
  .eyebrow { font-size: 28px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: ${accent}; }
  h1 { max-width: 860px; margin: 28px 0; font-size: 104px; line-height: .96; letter-spacing: -.065em; animation: rise .8s ease-out both; }
  .product-card { margin: 32px 0; padding: 46px; border: 1px solid rgba(255,255,255,.42); border-radius: 42px; background: rgba(10, 15, 30, .20); backdrop-filter: blur(12px); font-size: 38px; line-height: 1.3; animation: rise 1s .15s ease-out both; }
  .cta { align-self: flex-start; padding: 26px 34px; border-radius: 999px; background: ${accent}; color: ${secondary}; font-size: 32px; font-weight: 800; animation: rise 1s .3s ease-out both; }
  .caption { max-width: 850px; font-size: 27px; line-height: 1.35; opacity: .88; }
  @keyframes rise { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes drift { to { transform: scale(1.2) translate(40px, 30px); } }
</style></head><body>
<div id="video" data-width="1080" data-height="1920" data-duration="8" data-fps="30">
  <div class="orb orb-one"></div><div class="orb orb-two"></div>
  <div class="content">
    <div class="brand">${safeLogo ? `<img class="logo" src="${safeLogo}" />` : ""}<span>Product spotlight</span></div>
    <div><div class="eyebrow">Made for your audience</div><h1>${escapeHtml(title)}</h1><div class="product-card">${escapeHtml(voiceover)}</div></div>
    <div><div class="cta">${escapeHtml(cta || "Learn more")}</div><p class="caption">A branded product video, ready for Reels, TikTok, and Shorts.</p></div>
  </div>
  <audio src="voiceover.mp3" data-start="0" data-duration="8" data-volume="1"></audio>
</div>
</body></html>`;
}

async function createVoiceover(text: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for product-video voiceover generation.");
  }

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL ?? DEFAULT_TTS_MODEL,
      voice: "coral",
      input: oneLine(text, 200),
      response_format: "mp3"
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(payload.error?.message ?? `OpenAI voice generation returned HTTP ${response.status}.`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export async function generateProductVideo({
  projectId,
  extraction,
  audience,
  title,
  voiceover,
  cta,
  notes
}: {
  projectId: string;
  extraction: BrandExtraction;
  audience: SavedBrandAudience | null;
  title: string;
  voiceover: string;
  cta: string;
  notes?: string;
}) {
  const workingDirectory = await mkdtemp(join(tmpdir(), "distronow-hyperframes-"));

  try {
    const name = brandName(extraction);
    const spokenCopy = oneLine(voiceover, 200) || `${name} is made for ${audience?.name ?? "your next customer"}.`;
    const colors = getColorEntries(extraction.branding.colors).map(([, value]) => value).filter(Boolean).slice(0, 3);
    const outputPath = join(workingDirectory, "product-video.mp4");
    const cliPath = join(process.cwd(), "node_modules", "hyperframes", "bin", "hyperframes.mjs");

    await Promise.all([
      writeFile(join(workingDirectory, "composition.html"), videoComposition({ title: oneLine(title, 90), voiceover: spokenCopy, cta: oneLine(cta, 60), colors, logoUrl: extraction.branding.logo ?? extraction.branding.images?.logo }), "utf8"),
      writeFile(join(workingDirectory, "voiceover.mp3"), await createVoiceover(spokenCopy))
    ]);

    await run(process.execPath, [cliPath, "render", "-c", "composition.html", "-o", outputPath, "--quality", "draft", "--low-memory-mode", "--frames-cache-dir", "off"], {
      cwd: workingDirectory,
      timeout: 4 * 60 * 1000,
      maxBuffer: 1024 * 1024 * 4
    });

    const supabase = createSupabaseAdminClient();
    if (!supabase) {
      throw new Error("Missing Supabase server credentials.");
    }

    const storagePath = `${projectId}/${Date.now()}-product-video.mp4`;
    const { error: uploadError } = await supabase.storage.from("marketing-assets").upload(storagePath, await readFile(outputPath), {
      contentType: "video/mp4",
      upsert: false
    });

    if (uploadError) {
      throw new Error(`Could not upload product video: ${uploadError.message}`);
    }

    return {
      videoUrl: supabase.storage.from("marketing-assets").getPublicUrl(storagePath).data.publicUrl,
      storagePath,
      voiceover: spokenCopy,
      model: process.env.OPENAI_TTS_MODEL ?? DEFAULT_TTS_MODEL
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "HyperFrames could not render the product video.";
    if (message.includes("ENOENT") || message.includes("browser") || message.includes("ffmpeg")) {
      throw new Error("HyperFrames needs Chrome/Chromium and FFmpeg on the server before it can render product videos.");
    }
    throw error;
  } finally {
    await rm(workingDirectory, { recursive: true, force: true });
  }
}
