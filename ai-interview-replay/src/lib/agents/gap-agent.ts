import { callLLM } from "@/lib/ai/provider";
import { parseAgentJson, ensureArray, ensureString } from "./json";
import { GapAgentOutput } from "./types";
import { EvidenceCard, MaterialRecall, ReportBullet, DiagnosisClaim, EvidenceReference, MissingInfoItem } from "@/types/replay";
import { normalizeDiagnosisClaims } from "./quality-normalizers";

function normalizeGapOutput(raw: unknown, evidenceCards: EvidenceCard[]): GapAgentOutput {
  const obj = raw as Record<string, unknown>;
  return {
    liveAnswerDiagnosis: ensureArray<ReportBullet>(obj.liveAnswerDiagnosis).map((b) => ({
      title: ensureString((b as Record<string, unknown>).title),
      detail: ensureString((b as Record<string, unknown>).detail),
    })),
    calmAnswerImprovements: ensureArray<ReportBullet>(obj.calmAnswerImprovements).map((b) => ({
      title: ensureString((b as Record<string, unknown>).title),
      detail: ensureString((b as Record<string, unknown>).detail),
    })),
    liveLossAnalysis: ensureArray<ReportBullet>(obj.liveLossAnalysis).map((b) => ({
      title: ensureString((b as Record<string, unknown>).title),
      detail: ensureString((b as Record<string, unknown>).detail),
    })),
    gapClaims: normalizeDiagnosisClaims(obj.gapClaims, evidenceCards),
    summary: ensureString(obj.summary),
  };
}

export async function runGapAgent(ctx: {
  question: string;
  liveAnswer: string;
  calmAnswer: string;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
}): Promise<GapAgentOutput> {
  const cardsText = ctx.evidenceCards.map((c) => `- ${c.title}: ${c.content}`).join("\n");

  const prompt = `你是一个保研面试临场差距诊断器。请比较用户的临场回答和冷静回答，分析紧张状态下丢失了哪些关键信息。

## 面试问题
${ctx.question}

## 可用证据
${cardsText || "无"}
材料召回率: 实际使用 ${ctx.materialRecall.usedCount} / 应使用 ${ctx.materialRecall.expectedCount}

## 临场回答（紧张状态下说出的话）
${ctx.liveAnswer}

## 冷静回答（冷静后组织的话）
${ctx.calmAnswer}

## 要求
1. 诊断临场回答存在哪些问题
2. 分析冷静回答相比临场回答补充了什么
3. 系统分析临场损失类型：
   - 结论损失：没有先直接回答问题
   - 证据损失：没有使用项目/课程/论文等材料
   - 结构损失：回答顺序混乱
   - 深度损失：停留在兴趣/热爱/前景等表层表达
   - 匹配损失：没有连接目标方向
   - 边界损失：没有说清个人真实贡献
4. 输出 evidenceClaims（gapClaims），每条标注证据引用或信息缺口：
   - 如果判断"证据损失"，必须指出是哪张证据卡没被临场回答调用
   - 如果判断"边界损失"，必须指出缺少什么个人贡献信息
   - confidence：high（证据充分）/ medium（部分推理）/ low（信息不足）
5. 仅输出JSON

输出JSON结构：
{
  "liveAnswerDiagnosis": [
    {"title": "问题标题", "detail": "具体分析"}
  ],
  "calmAnswerImprovements": [
    {"title": "改进点标题", "detail": "补充了什么内容"}
  ],
  "liveLossAnalysis": [
    {"title": "损失类型（结论损失/证据损失/结构损失/深度损失/匹配损失/边界损失）", "detail": "丢失了什么"}
  ],
  "gapClaims": [
    {"title": "结论标题", "detail": "结论详情", "evidenceRefs": [{"evidenceCardId": "card_1", "evidenceCardTitle": "标题", "reason": "引用原因"}], "missingInfo": [{"field": "缺失字段", "reason": "缺失原因", "howToSupplement": "如何补充"}], "confidence": "high|medium|low"}
  ],
  "summary": "一句话总结临场损失"
}`;

  const raw = await callLLM(
    "你是一个保研面试临场差距诊断师。你的任务是分析紧张状态下的回答相比冷静回答丢失了什么。所有诊断结论必须绑定证据卡或信息缺口。仅输出JSON。",
    prompt
  );
  return normalizeGapOutput(parseAgentJson(raw), ctx.evidenceCards);
}
