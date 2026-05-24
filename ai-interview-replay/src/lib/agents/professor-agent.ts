import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { ProfessorAgentOutput } from "./types";
import { EvidenceCard, MaterialRecall, RiskRadarItem, RiskItem, AuthenticityWarning } from "@/types/replay";
import { normalizePressureTests } from "./quality-normalizers";

const RISK_DIMENSIONS = [
  "空泛表达风险",
  "证据不足风险",
  "贡献不清风险",
  "过度包装风险",
  "导师匹配不足风险",
  "追问承接不足风险",
] as const;

function normalizeProfessorOutput(raw: unknown, evidenceCards: EvidenceCard[]): ProfessorAgentOutput {
  const obj = raw as Record<string, unknown>;
  const rawRadar = ensureArray<Record<string, unknown>>(obj.riskRadar);
  const radarByDimension = new Map<string, Record<string, unknown>>();

  rawRadar.forEach((item) => {
    if (RISK_DIMENSIONS.includes(item.dimension as typeof RISK_DIMENSIONS[number])) {
      radarByDimension.set(item.dimension as string, item);
    }
  });

  return {
    riskRadar: RISK_DIMENSIONS.map((dimension) => {
      const r = radarByDimension.get(dimension) || {};
      return {
        dimension,
        level: (["低", "中", "高"].includes(r.level as string) ? r.level : "低") as RiskRadarItem["level"],
        reason: ensureString(r.reason, "该维度未发现明确风险。"),
        action: ensureString(r.action, "继续保持表达具体、证据清楚、边界明确。"),
      };
    }),
    followUpRisks: ensureArray<Record<string, unknown>>(obj.followUpRisks).map((r) => ({
      risk: ensureString(r.risk),
      reason: ensureString(r.reason),
      suggestedPreparation: ensureString(r.suggestedPreparation),
    })),
    authenticityWarnings: ensureArray<Record<string, unknown>>(obj.authenticityWarnings).map((w) => ({
      expression: ensureString(w.expression),
      riskType: ensureString(w.riskType),
      reason: ensureString(w.reason),
      saferAlternative: ensureString(w.saferAlternative),
    })),
    pressureTests: normalizePressureTests(obj.pressureTests, evidenceCards),
    summary: ensureString(obj.summary),
  };
}

export async function runProfessorAgent(ctx: {
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
  targetDirection?: string;
}): Promise<ProfessorAgentOutput> {
  const cardsText = ctx.evidenceCards.map((c) => `- ${c.id} ${c.title}: ${c.content} 风险：${c.usageRisk}`).join("\n");

  const prompt = `你是一个严格的保研面试导师风险审查员。请以审查者的视角分析回答中的风险。

## 面试问题
${ctx.question}

${ctx.targetDirection ? `目标方向：${ctx.targetDirection}` : ""}

## 可用证据
${cardsText || "无"}

## 用户回答
${ctx.answersText}

## 要求
1. 对以下6个维度逐一评估风险等级（低/中/高），每个都给出原因和改进建议：
   - 空泛表达风险
   - 证据不足风险
   - 贡献不清风险
   - 过度包装风险
   - 导师匹配不足风险
   - 追问承接不足风险

2. 识别回答中可能引发导师追问的具体表述

3. 识别过度包装、夸大或不真实的表达，给出更安全的替代方式

4. 输出 pressureTests，把风险升级成导师追问压力测试：风险表述、导师可能追问、危险原因、当前承接能力、安全回应
5. pressureTests 中的 evidenceRefs 必须引用上述证据卡 id；材料不足时写 missingInfo
6. 不要温和鼓励，要直接指出问题
7. 仅输出JSON

输出JSON结构：
{
  "riskRadar": [
    {"dimension": "空泛表达风险", "level": "低|中|高", "reason": "原因", "action": "改进建议"},
    {"dimension": "证据不足风险", "level": "低|中|高", "reason": "原因", "action": "改进建议"},
    {"dimension": "贡献不清风险", "level": "低|中|高", "reason": "原因", "action": "改进建议"},
    {"dimension": "过度包装风险", "level": "低|中|高", "reason": "原因", "action": "改进建议"},
    {"dimension": "导师匹配不足风险", "level": "低|中|高", "reason": "原因", "action": "改进建议"},
    {"dimension": "追问承接不足风险", "level": "低|中|高", "reason": "原因", "action": "改进建议"}
  ],
  "followUpRisks": [
    {"risk": "可能的追问", "reason": "追问原因", "suggestedPreparation": "准备建议"}
  ],
  "authenticityWarnings": [
    {"expression": "风险表述原文", "riskType": "过度包装 / 夸大贡献 / 不熟悉术语 / ...", "reason": "为什么有这个风险", "saferAlternative": "更安全的表达方式"}
  ],
  "pressureTests": [
    {
      "riskyExpression": "回答中的风险表述",
      "likelyQuestion": "导师可能追问什么",
      "dangerReason": "为什么危险",
      "currentSupportLevel": "strong | medium | weak",
      "safeResponse": "更安全的回应方式",
      "missingInfo": [
        {"field": "缺少的信息", "reason": "为什么影响承接", "howToSupplement": "如何补充"}
      ],
      "evidenceRefs": [
        {"evidenceCardId": "card_1", "evidenceCardTitle": "证据卡标题", "reason": "为什么相关"}
      ]
    }
  ],
  "summary": "一句话总结最重要的风险"
}`;

  const raw = await callLLM(
    "你是一个严格的保研面试导师。你专门挑刺，识别回答中的空泛、夸大、证据不足和追问风险。不要温和，直接指出问题。仅输出JSON。",
    prompt
  );
  return normalizeProfessorOutput(parseAgentJson(raw), ctx.evidenceCards);
}
