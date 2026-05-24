"use client";

import { PostReplayRequest, PostReplayResponse } from "@/types/replay";

export async function generatePostReport(req: PostReplayRequest): Promise<PostReplayResponse> {
  const res = await fetch("/api/replay/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "UNKNOWN_ERROR");
  }
  return data as PostReplayResponse;
}
