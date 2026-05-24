import { NextRequest, NextResponse } from "next/server";
import { runIntentAgent } from "@/lib/agents/intent-agent";
import { runEvidencePlannerAgent } from "@/lib/agents/evidence-planner-agent";
import { makeQuestionFingerprint, createInputFingerprint } from "@/lib/agents/fingerprint";
import { QuestionPreAnalysis, AgentTraceItem } from "@/types/replay";

function trace(agentName: string, summary: string, startMs: number, stage: AgentTraceItem["stage"]): AgentTraceItem {
  return {
    agentName,
    agentVersion: "v1",
    stage,
    summary: summary.slice(0, 100),
    status: "success",
    durationMs: Date.now() - startMs,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "请求体格式错误" } }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const question = typeof b.question === "string" ? b.question.trim() : "";
    if (!question) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "缺少必填字段 question" } }, { status: 400 });
    }

    const interviewType = typeof b.interviewType === "string" ? b.interviewType : undefined;
    const targetDirection = typeof b.targetDirection === "string" ? b.targetDirection : undefined;
    const targetSchool = typeof b.targetSchool === "string" ? b.targetSchool : undefined;
    const evidenceCards = Array.isArray(b.evidenceCards) ? b.evidenceCards : [];
    const materialFingerprint = typeof b.materialFingerprint === "string" ? b.materialFingerprint : "";

    const traces: AgentTraceItem[] = [];

    // Run Intent Agent
    const t0 = Date.now();
    const intent = await runIntentAgent({
      question,
      interviewType,
      targetDirection,
      targetSchool,
    });
    traces.push(trace("问题意图分析器", intent.summary, t0, "question"));

    // Run Evidence Planner
    const t1 = Date.now();
    const planner = await runEvidencePlannerAgent({
      question,
      questionIntent: intent.questionIntent,
      evidenceCards,
    });
    traces.push(trace("证据规划器", planner.summary, t1, "question"));

    const inputFingerprint = makeQuestionFingerprint(question, materialFingerprint || createInputFingerprint({ question }), targetDirection);

    const result: QuestionPreAnalysis = {
      questionIntent: intent.questionIntent,
      evaluationFocus: intent.evaluationFocus,
      idealAnswerLayers: intent.idealAnswerLayers,
      commonPitfalls: intent.commonPitfalls,
      expectedEvidence: planner.expectedEvidence,
      summary: `本题考察${intent.summary}，建议调用材料：${planner.summary}`,
      inputFingerprint,
      agentTrace: traces,
    };

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN_ERROR";

    if (msg.startsWith("MISSING_API_KEY")) {
      return NextResponse.json({ error: { code: "MISSING_API_KEY", message: "服务端缺少 LLM API Key" } }, { status: 500 });
    }
    if (msg.startsWith("MODEL_REQUEST_FAILED")) {
      return NextResponse.json({ error: { code: "MODEL_REQUEST_FAILED", message: "AI 模型调用失败，请稍后重试" } }, { status: 502 });
    }
    if (msg === "MODEL_RESPONSE_INVALID") {
      return NextResponse.json({ error: { code: "MODEL_RESPONSE_INVALID", message: "AI 返回结果格式异常，请重试" } }, { status: 502 });
    }
    return NextResponse.json({ error: { code: "UNKNOWN_ERROR", message: "问题分析暂不可用，最终复盘时会自动补充" } }, { status: 500 });
  }
}
