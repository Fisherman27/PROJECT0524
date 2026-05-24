import { PreReplayRequest, PostReplayRequest, QuestionsRequest } from "@/types/replay";

const MAX_TEXT_LENGTH = 5000;

export function validatePreRequest(body: unknown): PreReplayRequest {
  if (!body || typeof body !== "object") {
    throw new Error("VALIDATION_ERROR");
  }
  const b = body as Record<string, unknown>;

  const required = ["interviewType", "targetDirection", "backgroundMaterials", "question", "liveAnswer", "calmAnswer"];
  for (const field of required) {
    if (!b[field] || typeof b[field] !== "string" || !(b[field] as string).trim()) {
      throw new Error(`VALIDATION_ERROR: 缺少必填字段 ${field}`);
    }
  }

  return {
    interviewType: (b.interviewType as string).slice(0, 200),
    targetDirection: (b.targetDirection as string).slice(0, 500),
    targetSchool: typeof b.targetSchool === "string" ? (b.targetSchool as string).slice(0, 500) : undefined,
    backgroundMaterials: (b.backgroundMaterials as string).slice(0, MAX_TEXT_LENGTH),
    question: (b.question as string).slice(0, MAX_TEXT_LENGTH),
    liveAnswer: (b.liveAnswer as string).slice(0, MAX_TEXT_LENGTH),
    calmAnswer: (b.calmAnswer as string).slice(0, MAX_TEXT_LENGTH),
  };
}

export function validatePostRequest(body: unknown): PostReplayRequest {
  if (!body || typeof body !== "object") {
    throw new Error("VALIDATION_ERROR");
  }
  const b = body as Record<string, unknown>;

  const required = ["question", "interviewContext", "targetDirection"];
  for (const field of required) {
    if (!b[field] || typeof b[field] !== "string" || !(b[field] as string).trim()) {
      throw new Error(`VALIDATION_ERROR: 缺少必填字段 ${field}`);
    }
  }

  const answers = Array.isArray(b.answers) ? b.answers : [];
  const validAnswers = (answers as unknown[]).filter((a): a is Record<string, unknown> => {
    if (!a || typeof a !== "object") return false;
    const rec = a as Record<string, unknown>;
    return typeof rec.content === "string" && (rec.content as string).trim().length > 0;
  });

  if (validAnswers.length < 2) {
    throw new Error("VALIDATION_ERROR: 至少需要2个有效回答版本");
  }

  return {
    question: (b.question as string).slice(0, MAX_TEXT_LENGTH),
    interviewContext: (b.interviewContext as string).slice(0, 500),
    targetDirection: (b.targetDirection as string).slice(0, 500),
    backgroundMaterials:
      typeof b.backgroundMaterials === "string"
        ? (b.backgroundMaterials as string).slice(0, MAX_TEXT_LENGTH)
        : undefined,
    answers: validAnswers.map((rec) => ({
      label: typeof rec.label === "string" ? (rec.label as string).slice(0, 100) : "未标注",
      source: typeof rec.source === "string" ? (rec.source as string).slice(0, 100) : "未知来源",
      content: (rec.content as string).slice(0, MAX_TEXT_LENGTH),
    })),
  };
}

export function validateQuestionsRequest(body: unknown): QuestionsRequest {
  if (!body || typeof body !== "object") {
    throw new Error("VALIDATION_ERROR");
  }
  const b = body as Record<string, unknown>;

  if (!b.backgroundMaterials || typeof b.backgroundMaterials !== "string" || !b.backgroundMaterials.trim()) {
    throw new Error("VALIDATION_ERROR: 缺少必填字段 backgroundMaterials");
  }

  return {
    interviewType: typeof b.interviewType === "string" ? (b.interviewType as string).slice(0, 200) : undefined,
    targetDirection: typeof b.targetDirection === "string" ? (b.targetDirection as string).slice(0, 500) : undefined,
    backgroundMaterials: (b.backgroundMaterials as string).slice(0, MAX_TEXT_LENGTH),
  };
}
