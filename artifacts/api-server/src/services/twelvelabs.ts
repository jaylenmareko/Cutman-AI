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

  // Use raw HTTP for listing — reliable response format
  const resp = await tlFetch("/indexes?page=1&page_limit=50");
  const list: any[] = resp.data ?? [];
  const existing = list.find((idx: any) => (idx.index_name ?? idx.name ?? idx.indexName) === indexName);
  if (existing) return { id: existing._id ?? existing.id, name: indexName };

  // Create via raw HTTP
  const created = await tlFetch("/indexes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      index_name: indexName,
      models: [{ model_name: "marengo2.7", model_options: ["visual", "audio"] }],
    }),
  });
  return { id: created._id ?? created.id, name: indexName };
}

export async function uploadVideoFile(indexId: string, filePath: string): Promise<string> {
  const task = await client.tasks.create({
    indexId,
    videoFile: fs.createReadStream(filePath) as any,
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
