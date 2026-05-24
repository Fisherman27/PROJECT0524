import { NextRequest, NextResponse } from "next/server";
import { runMaterialAgent } from "@/lib/agents/material-agent";
import { makeMaterialFingerprint } from "@/lib/agents/fingerprint";
import { MaterialPreAnalysis } from "@/types/replay";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "请求体格式错误" } }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const backgroundMaterials = typeof b.backgroundMaterials === "string" ? b.backgroundMaterials : "";
    if (!backgroundMaterials.trim()) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "缺少必填字段 backgroundMaterials" } }, { status: 400 });
    }

    const targetDirection = typeof b.targetDirection === "string" ? b.targetDirection : undefined;
    const targetSchool = typeof b.targetSchool === "string" ? b.targetSchool : undefined;

    const t0 = Date.now();
    const material = await runMaterialAgent({
      backgroundMaterials,
      targetDirection,
      targetSchool,
    });

    const inputFingerprint = makeMaterialFingerprint(backgroundMaterials, targetDirection, targetSchool);

    const result: MaterialPreAnalysis = {
      evidenceCards: material.evidenceCards,
      summary: material.summary,
      inputFingerprint,
      agentTrace: [{
        agentName: "材料分析器",
        agentVersion: "v1",
        stage: "material",
        summary: material.summary.slice(0, 100),
        status: "success",
        durationMs: Date.now() - t0,
      }],
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
    return NextResponse.json({ error: { code: "UNKNOWN_ERROR", message: "材料分析失败，可稍后重试" } }, { status: 500 });
  }
}
