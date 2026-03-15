import { TwelveLabs } from "twelvelabs-js";
import fs from "fs";

const client = new TwelveLabs({ apiKey: process.env.TWELVELABS_API_KEY! });

export async function getOrCreateIndex(userId: number): Promise<{ id: string; name: string }> {
  const indexName = `cutman-ai-user-${userId}`;

  const resp = await client.indexes.list() as any;
  const list: any[] = resp.data ?? resp.items ?? (Array.isArray(resp) ? resp : []);
  const existing = list.find((idx: any) => (idx.indexName ?? idx.name) === indexName);
  if (existing) return { id: existing.id ?? existing._id, name: indexName };

  try {
    const created = await client.indexes.create({
      indexName,
      models: [{ modelName: "marengo2.7", modelOptions: ["visual", "audio"] }],
    }) as any;
    return { id: created.id ?? created._id, name: indexName };
  } catch (err: any) {
    if (err?.message?.includes("already exists") || err?.statusCode === 409 || err?.status === 409) {
      const resp2 = await client.indexes.list() as any;
      const list2: any[] = resp2.data ?? resp2.items ?? (Array.isArray(resp2) ? resp2 : []);
      const found = list2.find((idx: any) => (idx.indexName ?? idx.name) === indexName);
      if (found) return { id: found.id ?? found._id, name: indexName };
    }
    throw err;
  }
}

export async function uploadVideoFile(indexId: string, filePath: string): Promise<string> {
  const task = await client.tasks.create({
    indexId,
    file: fs.createReadStream(filePath) as any,
  }) as any;
  await task.waitForDone(5000);
  if (task.status === "failed") throw new Error("TwelveLabs indexing failed");
  return task.videoId;
}

export async function uploadVideoUrl(indexId: string, videoUrl: string): Promise<string> {
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    throw new Error("YouTube URLs are not supported. Please upload a video file directly.");
  }
  const task = await client.tasks.create({ indexId, url: videoUrl } as any) as any;
  await task.waitForDone(5000);
  if (task.status === "failed") throw new Error("TwelveLabs indexing failed");
  return task.videoId;
}

export async function analyzeVideo(indexId: string, indexName: string, videoId: string): Promise<string> {
  const summary = await (client as any).summarize(videoId, "summary", {
    prompt: "Describe all boxing technique, movement, footwork, offensive combinations, defensive habits, aggression patterns, and ring generalship observed in this fight video.",
  });

  const search = await client.search.query({
    indexId,
    queryText: "boxing punches jab cross hook uppercut footwork head movement defense offense combinations aggression",
    options: ["visual", "audio"],
    pageLimit: 20,
  } as any);

  return JSON.stringify({ summary, search });
}
