import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { SynthesizerAgentOutput } from "./types";
import {
  AuthenticityWarning,
  DiagnosisClaim,
  EvidenceCard,
  ExpectedEvidenceItem,
  MaterialRecall,
  ProfessorPressureTest,
  RiskRadarItem,
} from "@/types/replay";
import { normalizeSafeAnswer } from "./quality-normalizers";

function normalizeSynthesizerOutput(raw: unknown, evidenceCards: EvidenceCard[]): SynthesizerAgentOutput {
  const obj = raw as Record<string, unknown>;
  const bestMergedAnswer = ensureString(obj.bestMergedAnswer || (obj.safeAnswer as Record<string, unknown> | undefined)?.answer);
  return {
    bestMergedAnswer,
    safeAnswer: normalizeSafeAnswer(obj.safeAnswer, evidenceCards, bestMergedAnswer),
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
  pressureTests?: ProfessorPressureTest[];
  evidenceClaims?: DiagnosisClaim[];
  expectedEvidence?: ExpectedEvidenceItem[];
}): Promise<SynthesizerAgentOutput> {
  const cardsText = ctx.evidenceCards.map((c) => `- ${c.id} ${c.title}: ${c.suggestedExpression || c.content}`).join("\n");
  const riskText = ctx.riskRadar
    .filter((r) => r.level === "高")
    .map((r) => `- ${r.dimension}: ${r.action}`)
    .join("\n");
  const warnText = ctx.authenticityWarnings
    .map((w) => `- 避免："${w.expression}" → 用 "${w.saferAlternative}"`)
    .join("\n");
  const pressureText = ensureArray<ProfessorPressureTest>(ctx.pressureTests)
    .map((p) => `- 风险表述："${p.riskyExpression}"\n  追问：${p.likelyQuestion}\n  安全回应：${p.safeResponse}`)
    .join("\n");
  const claimText = ensureArray<DiagnosisClaim>(ctx.evidenceClaims)
    .map((c) => `- ${c.title}（${c.confidence}）：${c.detail}`)
    .join("\n");
  const expectedText = ensureArray<ExpectedEvidenceItem>(ctx.expectedEvidence)
    .map((e) => `- ${e.evidenceCardId} ${e.evidenceCardTitle}: ${e.suggestedUse}`)
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

## 导师压力测试
${pressureText || "无"}

## 证据诊断结论
${claimText || "无"}

## 本题应优先调用的证据
${expectedText || "无"}

## 要求（严格）
1. 生成优先级：真实性 > 可承接性 > 具体性 > 结构清晰 > 口述自然 > 高级感
2. 使用用户的真实材料和经历
3. 不编造用户没提供的经历、指标、论文、导师方向
4. 不能把参与说成主导，不能把 Prompt 设计包装成模型训练
5. 不过度包装，不使用用户可能不熟悉的术语
6. 适合口述，不是书面论文格式
7. 降低已识别的高风险和真实性风险
8. 材料召回率目前是 ${ctx.materialRecall.usedCount}/${ctx.materialRecall.expectedCount}，请尽可能调用更多可用证据
9. safeAnswer.usedEvidence 必须引用上述证据卡 id
10. safeAnswer.answer 控制在150字以内，适合口语表达
11. 仅输出JSON

输出JSON结构：
{
  "safeAnswer": {
    "answer": "安全回答，控制在150字以内，适合口语表达",
    "usedEvidence": [
      {"evidenceCardId": "card_1", "evidenceCardTitle": "证据卡标题", "reason": "为什么使用"}
    ],
    "riskControls": ["如何降低编造、夸大、追问风险"]
  },
  "bestMergedAnswer": "适合口述的最佳融合回答",
  "summary": "一句话说明融合了哪些来源"
}`;

  const raw = await callLLM(
    "你是一个保研面试回答重构师。你的任务是根据诊断结果生成更稳的面试回答。不编造经历，不过度包装，适合口述。仅输出JSON。",
    prompt
  );
  return normalizeSynthesizerOutput(parseAgentJson(raw), ctx.evidenceCards);
}
