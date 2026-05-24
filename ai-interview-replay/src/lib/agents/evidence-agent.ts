import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { EvidenceAgentOutput } from "./types";
import { EvidenceCard, MaterialRecall, ReportBullet, ExpectedEvidenceItem } from "@/types/replay";
import { normalizeDiagnosisClaims } from "./quality-normalizers";

function normalizeEvidenceOutput(raw: unknown, evidenceCards: EvidenceCard[]): EvidenceAgentOutput {
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
    evidenceClaims: normalizeDiagnosisClaims(obj.evidenceClaims, evidenceCards),
    summary: ensureString(obj.summary),
  };
}

export async function runEvidenceAgent(ctx: {
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  questionIntent: string;
  expectedEvidence?: ExpectedEvidenceItem[];
}): Promise<EvidenceAgentOutput> {
  const cardsText = ctx.evidenceCards
    .map((c) => `${c.id}. ${c.title}（${c.type}）: ${c.content} - 适合支撑: ${c.supportedQuestions.join("、")}`)
    .join("\n");

  const expectedText = ctx.expectedEvidence?.length
    ? ctx.expectedEvidence
        .map((e, i) => `${i + 1}. ${e.evidenceCardId} ${e.evidenceCardTitle}（优先级: ${e.priority}）: ${e.reason} - 建议用法: ${e.suggestedUse}`)
        .join("\n")
    : "";

  const expectedInstruction = expectedText
    ? `\n## 本题预先规划应调用材料（来自证据规划器）\n${expectedText}\n\n请以这些预先规划的材料作为"expected"（应调用）的基础。`
    : "\n请根据问题意图和可用证据卡，自行判断本题应该调用哪些材料。";

  const prompt = `你是一个材料证据匹配器。请判断用户的面试回答是否调用了合适的个人材料证据。

## 面试问题
${ctx.question}

## 问题意图
${ctx.questionIntent}
${expectedInstruction}
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
6. 输出 evidenceClaims，每条关键诊断都要尽量绑定 evidenceRefs；如果材料不足，则写 missingInfo
7. confidence 只能是 high / medium / low
8. 仅输出JSON

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
  "evidenceClaims": [
    {
      "title": "诊断结论",
      "detail": "具体说明",
      "evidenceRefs": [
        {
          "evidenceCardId": "card_1",
          "evidenceCardTitle": "证据卡标题",
          "quote": "可选短引用",
          "reason": "为什么引用这张证据卡"
        }
      ],
      "missingInfo": [
        {"field": "缺少的信息", "reason": "为什么影响判断", "howToSupplement": "如何补充"}
      ],
      "confidence": "high | medium | low"
    }
  ],
  "summary": "一句话总结"
}`;

  const raw = await callLLM(
    "你是一个保研面试材料证据匹配师。你判断用户的回答是否充分利用了个人背景材料。仅输出JSON。",
    prompt
  );
  return normalizeEvidenceOutput(parseAgentJson(raw), ctx.evidenceCards);
}
