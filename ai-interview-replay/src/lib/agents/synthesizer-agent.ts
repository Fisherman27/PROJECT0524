import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureString } from "./json";
import { SynthesizerAgentOutput } from "./types";
import { EvidenceCard, MaterialRecall, RiskRadarItem, AuthenticityWarning } from "@/types/replay";

function normalizeSynthesizerOutput(raw: unknown): SynthesizerAgentOutput {
  const obj = raw as Record<string, unknown>;
  return {
    bestMergedAnswer: ensureString(obj.bestMergedAnswer),
    summary: ensureString(obj.summary),
  };
}

export async function runSynthesizerAgent(ctx: {
  question: string;
  answersText: string;
  evidenceCards: EvidenceCard[];
  questionIntent: string;
  materialRecall: MaterialRecall;
  riskRadar: RiskRadarItem[];
  authenticityWarnings: AuthenticityWarning[];
}): Promise<SynthesizerAgentOutput> {
  const cardsText = ctx.evidenceCards.map((c) => `- ${c.title}: ${c.suggestedExpression || c.content}`).join("\n");
  const riskText = ctx.riskRadar
    .filter((r) => r.level === "高")
    .map((r) => `- ${r.dimension}: ${r.action}`)
    .join("\n");
  const warnText = ctx.authenticityWarnings
    .map((w) => `- 避免："${w.expression}" → 用 "${w.saferAlternative}"`)
    .join("\n");

  const prompt = `你是一个保研面试回答融合重构器。请根据诊断结果生成一个更稳的最佳融合回答。

## 面试问题
${ctx.question}

## 问题意图
${ctx.questionIntent}

## 用户回答
${ctx.answersText}

## 可用证据
${cardsText || "无"}

## 高风险点
${riskText || "无"}

## 真实性风险
${warnText || "无"}

## 要求（严格）
1. 使用用户的真实材料和经历
2. 不编造用户没提供的经历、指标、论文、导师方向
3. 不过度包装，不使用用户可能不熟悉的术语
4. 适合口述，不是书面论文格式
5. 降低已识别的高风险和真实性风险
6. 材料召回率目前是 ${ctx.materialRecall.usedCount}/${ctx.materialRecall.expectedCount}，请尽可能调用更多可用证据
7. 仅输出JSON

输出JSON结构：
{
  "bestMergedAnswer": "适合口述的最佳融合回答",
  "summary": "一句话说明融合了哪些来源"
}`;

  const raw = await callLLM(
    "你是一个保研面试回答重构师。你的任务是根据诊断结果生成更稳的面试回答。不编造经历，不过度包装，适合口述。仅输出JSON。",
    prompt
  );
  return normalizeSynthesizerOutput(parseAgentJson(raw));
}
