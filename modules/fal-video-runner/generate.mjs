import { fal } from "@fal-ai/client";
import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { basename } from "node:path";

const references = [
  "/Users/vicorico/Downloads/WhatsApp Image 2026-08-14 at 03.06.33.jpeg",
  "/Users/vicorico/Downloads/WhatsApp Image 2026-08-14 at 18.12.31.jpeg"
];

const prompt = `Image 1 is Trânte, the stylized anthropomorphic frog BJJ athlete: preserve the frog anatomy, pink-and-cream no-gi uniform, purple belt, and focused expression. Image 2 is the gym setting: preserve its clean pale mats, grey wall padding, black ceiling with linear lights, gym equipment, and centered wall branding.

A polished 5-second cinematic character showcase. Begin with Trânte standing centered on the mat in a clean full-body composition, calm and ready to grapple. Camera: pedestal up. Movement: move the entire camera vertically upward in a straight line. Speed: smooth constant lift. Framing: keep the lens level and pointed in the same direction throughout the vertical move; preserve Trânte’s readability as the framing rises from the full stance and purple belt toward the focused face and upper body. End: finish with the higher framing clearly readable, with the gym clearly visible behind him. Premium cinematic lighting, natural subtle idle movement, no cuts, no zoom, no pan, no tilt, no distorted anatomy, no additional foreground people.`;

if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not configured");
fal.config({ credentials: process.env.FAL_KEY });

const referenceImageUrls = await Promise.all(references.map(async (path) => {
  const bytes = await readFile(path);
  return fal.storage.upload(new File([bytes], basename(path), { type: "image/jpeg" }));
}));

const endpointId = "minimax/h3/reference-to-video";
const result = await fal.queue.submit(endpointId, {
  input: {
    prompt,
    reference_image_urls: referenceImageUrls,
    duration: 5,
    resolution: "4K",
    aspect_ratio: "16:9",
    enable_safety_checker: true,
    enable_prompt_expansion: true
  },
});

const job = { endpointId, requestId: result.request_id, statusUrl: result.status_url, responseUrl: result.response_url };
await writeFile("last-job.json", JSON.stringify(job, null, 2));
console.log(JSON.stringify(job, null, 2));
