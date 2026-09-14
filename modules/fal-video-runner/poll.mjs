import { fal } from "@fal-ai/client";
import { readFile } from "node:fs/promises";

if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not configured");
fal.config({ credentials: process.env.FAL_KEY });

const { endpointId, requestId } = JSON.parse(await readFile("last-job.json", "utf8"));
const status = await fal.queue.status(endpointId, { requestId, logs: true });
if (status.status !== "COMPLETED") {
  console.log(JSON.stringify(status, null, 2));
} else {
  const result = await fal.queue.result(endpointId, { requestId });
  console.log(JSON.stringify({ requestId, ...result.data }, null, 2));
}
