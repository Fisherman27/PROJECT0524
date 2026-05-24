import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { TrainingAgentOutput } from "./types";
import { MaterialRecall, RiskRadarItem, AuthenticityWarning, ReplayCard, ReportBullet } from "@/types/replay";

function normalizeTrainingOutput(raw: unknown): TrainingAgentOutput {
  const obj = raw as Record<string, unknown>;
  const card = (obj.replayCard || {}) as Record<string, unknown>;
  return {
    rescueTemplate: typeof obj.rescueTemplate === "string" ? obj.rescueTemplate : undefined,
    transferableFormula: typeof obj.transferableFormula === "string" ? obj.transferableFormula : undefined,
    nextPracticeAdvice: Array.isArray(obj.nextPracticeAdvice)
      ? (obj.nextPracticeAdvice as ReportBullet[])
      : undefined,
    nextInterviewChecklist: Array.isArray(obj.nextInterviewChecklist)
      ? (obj.nextInterviewChecklist as string[])
      : undefined,
    replayCard: {
      biggestProblem: ensureString(card.biggestProblem),
      keyImprovement: ensureString(card.keyImprovement),
      nextFormula: ensureString(card.nextFormula),
      rescueSentence: ensureString(card.rescueSentence),
      nextQuestion: ensureString(card.nextQuestion),
    },
    summary: ensureString(obj.summary),
  };
}

export async function runTrainingAgent(ctx: {
  mode: "pre" | "post";
  question: string;
  questionIntent: string;
  materialRecall: MaterialRecall;
  riskRadar: RiskRadarItem[];
  authenticityWarnings: AuthenticityWarning[];
  bestMergedAnswer: string;
}): Promise<TrainingAgentOutput> {
  const riskText = ctx.riskRadar
    .filter((r) => r.level !== "低")
    .map((r) => `- ${r.dimension}: ${r.level} - ${r.action}`)
    .join("\n");

  const prompt = `你是一个保研面试训练规划师。请将本次复盘结果转化为下一步可执行的训练计划。

## 面试问题
${ctx.question}

## 问题意图
${ctx.questionIntent}

## 复盘结果
- 材料召回率: ${ctx.materialRecall.usedCount}/${ctx.materialRecall.expectedCount}
- 主要风险: 
${riskText || "无高风险"}

## 最佳融合回答参考
${ctx.bestMergedAnswer.slice(0, 500)}

## 要求
1. 生成复盘卡片：最大问题、核心改进点、下次回答公式、救场句、下一题建议
2. ${ctx.mode === "pre" ? "生成救场模板和下次练习建议" : "生成可迁移回答公式和下一场面试准备清单"}
3. 仅输出JSON

输出JSON结构：
{
  ${ctx.mode === "pre" ? '"rescueTemplate": "下次紧张时可套用的救场模板（用 ___ 留空）",\n  "nextPracticeAdvice": [{"title": "练习方向", "detail": "具体建议"}],' : '"transferableFormula": "同类问题的可迁移回答公式",\n  "nextInterviewChecklist": ["准备事项1", "准备事项2"],'}
  "replayCard": {
    "biggestProblem": "本次回答最大问题",
    "keyImprovement": "最关键的改进点",
    "nextFormula": "下次回答公式",
    "rescueSentence": "一句救场话术",
    "nextQuestion": "下一道建议练习的问题"
  },
  "summary": "一句话总结训练建议"
}`;

  const raw = await callLLM(
    "你是一个保研面试训练规划师。你的任务是把复盘结果转化为用户下一轮可执行的训练计划。仅输出JSON。",
    prompt
  );
  return normalizeTrainingOutput(parseAgentJson(raw));
}
