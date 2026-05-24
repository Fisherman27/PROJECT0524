import { NextRequest, NextResponse } from "next/server";
import { validatePostRequest } from "@/lib/schemas";
import { runPostReplayAgents } from "@/lib/agents/runner";
import { formatPostCopyText } from "@/lib/copy-format";

export async function POST(req: NextRequest) {
  try {
    const validated = validatePostRequest(await req.json());
    const report = await runPostReplayAgents(validated);
    const copyText = formatPostCopyText(report);
    return NextResponse.json({ mode: "post", report, copyText });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN_ERROR";

    if (msg.startsWith("MISSING_API_KEY")) {
      return NextResponse.json({ error: { code: "MISSING_API_KEY", message: "服务端缺少 LLM API Key，请检查 .env.local 配置" } }, { status: 500 });
    }
    if (msg.startsWith("VALIDATION_ERROR")) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: msg.replace("VALIDATION_ERROR: ", "") } }, { status: 400 });
    }
    if (msg.startsWith("MODEL_REQUEST_FAILED")) {
      return NextResponse.json({ error: { code: "MODEL_REQUEST_FAILED", message: "AI 模型调用失败，请稍后重试" } }, { status: 502 });
    }
    if (msg === "MODEL_RESPONSE_INVALID") {
      return NextResponse.json({ error: { code: "MODEL_RESPONSE_INVALID", message: "AI 返回结果格式异常，请重试" } }, { status: 502 });
    }
    return NextResponse.json({ error: { code: "UNKNOWN_ERROR", message: "服务器内部错误" } }, { status: 500 });
  }
}
