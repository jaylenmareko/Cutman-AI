import fs from "fs";
import FormData from "form-data";

const BASE_URL = "https://api.twelvelabs.io/v1.2";
const API_KEY = process.env.TWELVELABS_API_KEY!;

async function tlFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "x-api-key": API_KEY,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TwelveLabs API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function getOrCreateIndex(userId: number): Promise<string> {
  const indexName = `cutman-ai-user-${userId}`;
  const resp = await tlFetch("/indexes?page=1&page_limit=50");
  const existing = resp.data?.find((idx: any) => idx.name === indexName);
  if (existing) return existing._id;

  const created = await tlFetch("/indexes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: indexName,
      models: [
        { name: "marengo2.7", options: ["visual", "conversation", "text_in_video", "logo"] },
        { name: "pegasus1.2", options: ["visual", "conversation"] },
      ],
    }),
  });
  return created._id;
}

async function pollTask(taskId: string, maxMinutes = 15): Promise<void> {
  const deadline = Date.now() + maxMinutes * 60 * 1000;
  while (Date.now() < deadline) {
    const task = await tlFetch(`/tasks/${taskId}`);
    if (task.status === "ready") return;
    if (task.status === "failed") throw new Error(`TwelveLabs indexing failed: ${task.error?.message}`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("TwelveLabs indexing timed out");
}

export async function uploadVideoFile(indexId: string, filePath: string): Promise<string> {
  const form = new FormData();
  form.append("index_id", indexId);
  form.append("video_file", fs.createReadStream(filePath));

  const res = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      ...form.getHeaders(),
    },
    body: form as any,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TwelveLabs upload error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const taskId = data._id;
  await pollTask(taskId);

  const taskInfo = await tlFetch(`/tasks/${taskId}`);
  return taskInfo.video_id;
}

export async function uploadYouTubeUrl(indexId: string, youtubeUrl: string): Promise<string> {
  const data = await tlFetch("/tasks/external-provider", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index_id: indexId, url: youtubeUrl }),
  });
  const taskId = data._id;
  await pollTask(taskId);
  const taskInfo = await tlFetch(`/tasks/${taskId}`);
  return taskInfo.video_id;
}

export async function analyzeVideo(videoId: string): Promise<string> {
  const summaryResp = await tlFetch(`/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_id: videoId,
      type: "summary",
    }),
  });

  const searchResp = await tlFetch(`/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      index_id: videoId,
      query_text: "boxing punches kicks movement footwork defense offense aggression",
      options: ["visual", "conversation"],
      page_limit: 20,
    }),
  });

  return JSON.stringify({
    summary: summaryResp,
    search: searchResp,
  });
}
