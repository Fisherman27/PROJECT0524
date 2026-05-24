import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { DiffAgentOutput } from "./types";
import { EvidenceCard, MaterialRecall, SentenceDiagnosis } from "@/types/replay";

function normalizeDiffOutput(raw: unknown): DiffAgentOutput {
  const obj = raw as Record<string, unknown>;
  return {
    answerRanking: ensureArray<Record<string, unknown>>(obj.answerRanking).map((r) => ({
      label: ensureString(r.label),
      rank: typeof r.rank === "number" ? r.rank : 1,
      reason: ensureString(r.reason),
    })),
    versionReviews: ensureArray<Record<string, unknown>>(obj.versionReviews).map((v) => ({
      label: ensureString(v.label),
      strengths: ensureArray<string>(v.strengths),
      problems: ensureArray<string>(v.problems),
      keepParts: ensureArray<string>(v.keepParts),
      avoidParts: ensureArray<string>(v.avoidParts),
    })),
    sentenceDiagnosis: ensureArray<Record<string, unknown>>(obj.sentenceDiagnosis).map((d) => ({
      original: ensureString(d.original),
      diagnosis: ensureString(d.diagnosis),
      suggestion: ensureString(d.suggestion),
    })),
    summary: ensureString(obj.summary),
  };
}

export async function runDiffAgent(ctx: {
  question: string;
  answers: Array<{ label: string; source: string; content: string }>;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
}): Promise<DiffAgentOutput> {
  const answersText = ctx.answers
    .map((a) => `### ${a.label}（来源：${a.source}）\n${a.content}`)
    .join("\n\n");

  const prompt = `你是一个保研面试多版本回答差异诊断器。请比较多个回答版本的优劣。

## 面试问题
${ctx.question}

## 材料召回率参考
实际使用 ${ctx.materialRecall.usedCount} / 应使用 ${ctx.materialRecall.expectedCount}

## 回答版本
${answersText}

## 要求
1. 综合排名各版本（从导师视角）
2. 分析每个版本的优点、问题、值得保留的部分、不建议使用的部分
3. 对关键句子进行逐句诊断
4. 仅输出JSON

输出JSON结构：
{
  "answerRanking": [
    {"label": "A", "rank": 1, "reason": "排名理由"}
  ],
  "versionReviews": [
    {"label": "A", "strengths": ["优点1"], "problems": ["问题1"], "keepParts": ["保留1"], "avoidParts": ["避免1"]}
  ],
  "sentenceDiagnosis": [
    {"original": "原句", "diagnosis": "问题诊断", "suggestion": "改进建议"}
  ],
  "summary": "一句话总结"
}`;

  const raw = await callLLM(
    "你是一个保研面试多版本回答分析师。你从导师视角比较不同回答的优劣。仅输出JSON。",
    prompt
  );
  return normalizeDiffOutput(parseAgentJson(raw));
}
