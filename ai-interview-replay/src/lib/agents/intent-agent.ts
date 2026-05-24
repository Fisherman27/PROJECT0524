import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { IntentAgentOutput } from "./types";

function normalizeIntentOutput(raw: unknown): IntentAgentOutput {
  const obj = raw as Record<string, unknown>;
  return {
    questionIntent: ensureString(obj.questionIntent),
    evaluationFocus: ensureArray<string>(obj.evaluationFocus),
    idealAnswerLayers: ensureArray<string>(obj.idealAnswerLayers),
    commonPitfalls: ensureArray<string>(obj.commonPitfalls),
    summary: ensureString(obj.summary),
  };
}

export async function runIntentAgent(ctx: {
  question: string;
  interviewType?: string;
  targetDirection?: string;
  targetSchool?: string;
}): Promise<IntentAgentOutput> {
  const prompt = `你是一个保研面试问题意图分析器。请判断这道面试题背后的真实考察目标。

## 面试问题
${ctx.question}

${ctx.interviewType ? `面试类型：${ctx.interviewType}` : ""}
${ctx.targetDirection ? `目标方向：${ctx.targetDirection}` : ""}
${ctx.targetSchool ? `目标院校：${ctx.targetSchool}` : ""}

## 要求
1. 判断这道题真实考察什么（不只是表面问题）
2. 列出导师评价这道题回答时关注的关键能力
3. 列出理想回答应包含的信息层次
4. 列出常见的答偏方式
5. 仅输出JSON

输出JSON结构：
{
  "questionIntent": "这道题在保研面试中主要考察什么（2-3句话）",
  "evaluationFocus": ["导师关注的关键能力1", "关键能力2", ...],
  "idealAnswerLayers": ["理想回答应包含的层1", "层2", ...],
  "commonPitfalls": ["常见答偏方式1", "方式2", ...],
  "summary": "一句话概括意图分析"
}`;

  const raw = await callLLM(
    "你是一个保研面试问题意图分析师。你帮助理解面试题背后的真实考察目标。仅输出JSON。",
    prompt
  );
  return normalizeIntentOutput(parseAgentJson(raw));
}
