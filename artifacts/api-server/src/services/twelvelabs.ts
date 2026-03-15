import { TwelveLabs } from "twelvelabs-js";
import fs from "fs";

const client = new TwelveLabs({ apiKey: process.env.TWELVELABS_API_KEY! });
const BASE_URL = "https://api.twelvelabs.io/v1.3";
const API_KEY = process.env.TWELVELABS_API_KEY!;

async function tlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { "x-api-key": API_KEY, ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TwelveLabs API error ${res.status} [${path}]: ${body}`);
  }
  return res.json();
}

export async function getOrCreateIndex(userId: number): Promise<{ id: string; name: string }> {
  const indexName = `cutman-ai-user-${userId}`;

  // List existing indexes
  const resp = await tlFetch("/indexes?page=1&page_limit=50");
  console.log("[TL] indexes list raw:", JSON.stringify(resp).slice(0, 500));
  const list: any[] = Array.isArray(resp) ? resp : (resp.data ?? resp.items ?? resp.indexes ?? []);
  console.log("[TL] list length:", list.length, "fields:", list[0] ? Object.keys(list[0]) : []);
  const existing = list.find((idx: any) =>
    [idx.index_name, idx.name, idx.indexName].includes(indexName)
  );
  if (existing) {
    const id = existing._id ?? existing.id;
    console.log("[TL] found existing index:", id);
    return { id, name: indexName };
  }

  // Create new index
  try {
    const created = await tlFetch("/indexes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        index_name: indexName,
        models: [{ model_name: "marengo2.7", model_options: ["visual", "audio"] }],
      }),
    });
    const id = created._id ?? created.id;
    console.log("[TL] created new index:", id);
    return { id, name: indexName };
  } catch (err: any) {
    // 409 means it exists but list didn't return it — fetch all pages
    if (err?.message?.includes("409") || err?.message?.includes("already exists")) {
      console.log("[TL] 409 hit, fetching page 2...");
      for (let page = 1; page <= 5; page++) {
        const r = await tlFetch(`/indexes?page=${page}&page_limit=50`);
        const items: any[] = Array.isArray(r) ? r : (r.data ?? []);
        const found = items.find((idx: any) =>
          [idx.index_name, idx.name, idx.indexName].includes(indexName)
        );
        if (found) return { id: found._id ?? found.id, name: indexName };
        if (items.length < 50) break;
      }
    }
    throw err;
  }
}

async function pollUntilReady(taskId: string, maxMinutes = 20): Promise<string> {
  const deadline = Date.now() + maxMinutes * 60 * 1000;
  while (Date.now() < deadline) {
    const task = await tlFetch(`/tasks/${taskId}`);
    console.log("[TL] task status:", task.status, "taskId:", taskId);
    if (task.status === "ready") return task.video_id ?? task.videoId;
    if (task.status === "failed") throw new Error(`TwelveLabs indexing failed: ${task.error?.message ?? "unknown"}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("TwelveLabs indexing timed out after 20 minutes");
}

export async function uploadVideoFile(indexId: string, filePath: string): Promise<string> {
  const task = await client.tasks.create({
    indexId,
    videoFile: fs.createReadStream(filePath) as any,
  }) as any;
  const taskId = task._id ?? task.id;
  console.log("[TL] upload task created:", taskId);
  return pollUntilReady(taskId);
}

export async function uploadVideoUrl(indexId: string, videoUrl: string): Promise<string> {
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    throw new Error("YouTube URLs are not supported. Please upload a video file directly.");
  }
  const task = await client.tasks.create({ indexId, url: videoUrl } as any) as any;
  const taskId = task._id ?? task.id;
  console.log("[TL] url task created:", taskId);
  return pollUntilReady(taskId);
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
