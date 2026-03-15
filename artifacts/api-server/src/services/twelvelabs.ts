import fs from "fs";
import FormData from "form-data";

const BASE_URL = "https://api.twelvelabs.io/v1.3";
const API_KEY = process.env.TWELVELABS_API_KEY!;

async function tlFetch(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "x-api-key": API_KEY,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TwelveLabs API error ${res.status} [${path}]: ${body}`);
  }
  return res.json();
}

export async function getOrCreateIndex(userId: number): Promise<{ id: string; name: string }> {
  const indexName = `cutman-ai-user-${userId}`;

  const resp = await tlFetch("/indexes?page=1&page_limit=50");
  const existing = resp.data?.find(
    (idx: any) => (idx.index_name ?? idx.name) === indexName
  );
  if (existing) return { id: existing._id, name: indexName };

  const created = await tlFetch("/indexes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      index_name: indexName,
      models: [
        {
          model_name: "marengo2.7",
          model_options: ["visual", "audio"],
        },
        {
          model_name: "pegasus1.2",
          model_options: ["visual", "audio"],
        },
      ],
    }),
  });
  return { id: created._id, name: indexName };
}

async function pollTask(taskId: string, maxMinutes = 20): Promise<void> {
  const deadline = Date.now() + maxMinutes * 60 * 1000;
  while (Date.now() < deadline) {
    const task = await tlFetch(`/tasks/${taskId}`);
    const status: string = task.status;
    if (status === "ready") return;
    if (status === "failed") {
      throw new Error(`TwelveLabs indexing failed: ${task.error?.message ?? "unknown reason"}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("TwelveLabs indexing timed out after 20 minutes");
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

export async function analyzeVideo(indexId: string, indexName: string, videoId: string): Promise<string> {
  // Generate a full summary using Pegasus (v1.3: /analyze endpoint)
  const generateResp = await tlFetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_id: videoId,
      prompt:
        "Provide a comprehensive, detailed description of all boxing technique, movement, footwork, offensive combinations, defensive habits, aggression patterns, and ring generalship observed throughout this fight video.",
    }),
  });

  // Search for specific boxing patterns using Marengo
  const searchResp = await tlFetch("/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      index_id: indexId,
      query_text:
        "boxing punches jab cross hook uppercut footwork head movement defense offense combinations aggression",
      search_options: ["visual", "audio"],
      page_limit: 20,
    }),
  });

  return JSON.stringify({
    summary: generateResp,
    search: searchResp,
  });
}
