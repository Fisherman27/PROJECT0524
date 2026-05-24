import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { EvidenceAgentOutput } from "./types";
import { EvidenceCard, MaterialRecall, ReportBullet } from "@/types/replay";

function normalizeEvidenceOutput(raw: unknown): EvidenceAgentOutput {
  const obj = raw as Record<string, unknown>;
  const mr = (obj.materialRecall || {}) as Record<string, unknown>;
  return {
    materialRecall: {
      expectedCount: typeof mr.expectedCount === "number" ? mr.expectedCount : 0,
      usedCount: typeof mr.usedCount === "number" ? mr.usedCount : 0,
      usedEvidence: ensureArray<string>(mr.usedEvidence),
      missingEvidence: ensureArray<string>(mr.missingEvidence),
      recallSummary: ensureString(mr.recallSummary),
      improvementHint: ensureString(mr.improvementHint),
    },
    missingEvidence: ensureArray<ReportBullet>(obj.missingEvidence).map((b) => ({
      title: (b as Record<string, unknown>).title ? ensureString((b as Record<string, unknown>).title) : "",
      detail: ensureString((b as Record<string, unknown>).detail),
    })),
    summary: ensureString(obj.summary),
  };
}

export async function runEvidenceAgent(ctx: {
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  questionIntent: string;
}): Promise<EvidenceAgentOutput> {
  const cardsText = ctx.evidenceCards
    .map((c, i) => `${i + 1}. ${c.title}（${c.type}）: ${c.content} - 适合支撑: ${c.supportedQuestions.join("、")}`)
    .join("\n");

  const prompt = `你是一个材料证据匹配器。请判断用户的面试回答是否调用了合适的个人材料证据。

## 面试问题
${ctx.question}

## 问题意图
${ctx.questionIntent}

## 可用证据卡
${cardsText || "无可用证据卡"}

## 用户回答
${ctx.answersText}

## 要求
1. 判断用户回答调用了哪些可用证据（usedEvidence）
2. 判断用户遗漏了哪些本应使用的证据（missingEvidence）
3. 计算材料召回率：usedCount / expectedCount
4. 分析遗漏了什么关键支撑内容
5. 给出改进方向
6. 仅输出JSON

输出JSON结构：
{
  "materialRecall": {
    "expectedCount": 本应使用的证据数量,
    "usedCount": 实际使用的证据数量,
    "usedEvidence": ["已使用的证据标题"],
    "missingEvidence": ["遗漏的证据标题"],
    "recallSummary": "一句话概括材料调用情况",
    "improvementHint": "如何提高材料利用率的建议"
  },
  "missingEvidence": [
    {"title": "遗漏的材料名称", "detail": "为什么应该使用它"}
  ],
  "summary": "一句话总结"
}`;

  const raw = await callLLM(
    "你是一个保研面试材料证据匹配师。你判断用户的回答是否充分利用了个人背景材料。仅输出JSON。",
    prompt
  );
  return normalizeEvidenceOutput(parseAgentJson(raw));
}
