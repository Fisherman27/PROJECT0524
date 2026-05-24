import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson } from "./json";
import { VerifierAgentOutput } from "./types";
import { AuthenticityWarning, EvidenceCard, ProfessorPressureTest } from "@/types/replay";
import { normalizeVerification } from "./quality-normalizers";

export async function runVerifierAgent(ctx: {
  question: string;
  answer: string;
  evidenceCards: EvidenceCard[];
  pressureTests: ProfessorPressureTest[];
  authenticityWarnings: AuthenticityWarning[];
  questionIntent: string;
}): Promise<VerifierAgentOutput> {
  const cardsText = ctx.evidenceCards
    .map((c) => `- ${c.id} ${c.title}: ${c.content}`)
    .join("\n");
  const pressureText = ctx.pressureTests
    .map((p) => `- 风险表述："${p.riskyExpression}"\n  追问：${p.likelyQuestion}\n  安全回应：${p.safeResponse}`)
    .join("\n");
  const warningText = ctx.authenticityWarnings
    .map((w) => `- 避免："${w.expression}" → ${w.saferAlternative}。原因：${w.reason}`)
    .join("\n");

  const prompt = `你是最终回答安全校验员。你只检查最终回答是否真实、安全、可承接，不负责重新生成长篇回答。

## 面试问题
${ctx.question}

## 问题意图
${ctx.questionIntent}

## 可用证据卡
${cardsText || "无"}

## 已识别压力测试
${pressureText || "无"}

## 已识别真实性风险
${warningText || "无"}

## 待校验最终回答
${ctx.answer}

## 检查清单
1. 是否使用未提供材料
2. 是否夸大个人贡献
3. 是否引入无法承接术语
4. 是否正面回答问题
5. 是否保留具体证据
6. 是否适合口述
7. 是否带来新追问风险

## 要求
1. 只输出安全校验结果，不要重新写长篇分析
2. 如果发现 high severity 问题，可以给 revisedAnswer，必须比原回答更安全
3. revisedAnswer 不要引入新经历、新指标、新论文或新导师方向
4. evidenceRefs 必须引用上述证据卡 id；没有证据就留空
5. 仅输出JSON

输出JSON结构：
{
  "verification": {
    "passed": true,
    "summary": "一句话校验结论",
    "issues": [
      {
        "issueType": "unsupported_claim | overclaim | unclear_contribution | unanswerable_term | off_topic | not_oral_friendly | new_followup_risk",
        "originalText": "风险原文",
        "reason": "为什么有风险",
        "suggestedFix": "建议如何改",
        "severity": "high | medium | low",
        "evidenceRefs": [
          {"evidenceCardId": "card_1", "evidenceCardTitle": "证据卡标题", "reason": "为什么相关"}
        ]
      }
    ],
    "revisedAnswer": "可选：更安全的修正版"
  },
  "summary": "一句话总结校验结果"
}`;

  const raw = await callLLM(
    "你是保研面试最终回答安全校验员。你检查编造、夸大、答偏和不可承接风险。仅输出JSON。",
    prompt,
  );
  const parsed = parseAgentJson<Record<string, unknown>>(raw);
  const verification = normalizeVerification(parsed.verification, ctx.evidenceCards);
  return {
    verification,
    summary: typeof parsed.summary === "string" ? parsed.summary : verification.summary,
  };
}
