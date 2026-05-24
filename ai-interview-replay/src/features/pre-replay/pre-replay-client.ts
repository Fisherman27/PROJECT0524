"use client";

import { PreReplayRequest, PreReplayResponse, QuestionsRequest, QuestionsResponse } from "@/types/replay";

export async function generateQuestion(req: QuestionsRequest): Promise<QuestionsResponse> {
  const res = await fetch("/api/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "UNKNOWN_ERROR");
  }
  return data as QuestionsResponse;
}

export async function generatePreReport(req: PreReplayRequest): Promise<PreReplayResponse> {
  const res = await fetch("/api/replay/pre", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "UNKNOWN_ERROR");
  }
  return data as PreReplayResponse;
}
