import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { EvidenceCard, ExpectedEvidenceItem } from "@/types/replay";

export type EvidencePlannerOutput = {
  expectedEvidence: ExpectedEvidenceItem[];
  summary: string;
};

function normalizePlannerOutput(raw: unknown): EvidencePlannerOutput {
  const obj = raw as Record<string, unknown>;
  return {
    expectedEvidence: ensureArray<Record<string, unknown>>(obj.expectedEvidence).map((e) => ({
      title: ensureString(e.title),
      evidenceCardTitle: ensureString(e.evidenceCardTitle),
      reason: ensureString(e.reason),
      priority: (e.priority as ExpectedEvidenceItem["priority"]) || "medium",
      suggestedUse: ensureString(e.suggestedUse),
    })),
    summary: ensureString(obj.summary),
  };
}

export async function runEvidencePlannerAgent(ctx: {
  question: string;
  questionIntent: string;
  evidenceCards: EvidenceCard[];
}): Promise<EvidencePlannerOutput> {
  const cardsText = ctx.evidenceCards
    .map((c, i) => `${i + 1}. ${c.title}（${c.type}）: ${c.content}`)
    .join("\n");

  const prompt = `你是一个证据规划器。你根据面试问题和问题意图，预先判断这道题最应该调用哪些个人材料。

## 面试问题
${ctx.question}

## 问题意图
${ctx.questionIntent}

## 可用证据卡
${cardsText || "无可用证据卡"}

## 要求
1. 从可用证据卡中选择最多3项最适合支撑这道题的证据
2. 说明为什么这道题需要调用该材料
3. 给出一句建议用法
4. 不编造新的经历
5. 仅输出JSON

输出JSON结构：
{
  "expectedEvidence": [
    {
      "title": "简短推荐标题",
      "evidenceCardTitle": "对应证据卡标题（必须来自上述可用证据卡）",
      "reason": "为什么这道题需要这个证据",
      "priority": "high | medium | low",
      "suggestedUse": "建议如何使用这个证据"
    }
  ],
  "summary": "一句话总结推荐调用哪些材料"
}`;

  const raw = await callLLM(
    "你是一个保研面试证据规划师。你预判某道题最应该调用哪些个人材料。仅输出JSON。",
    prompt
  );
  return normalizePlannerOutput(parseAgentJson(raw));
}
