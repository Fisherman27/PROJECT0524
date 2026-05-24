import {
  AgentTraceItem,
  AnswerMaturity,
  AnswerVerification,
  DiagnosisClaim,
  EvidenceCard,
  PostReplayReport,
  PreReplayReport,
  ProfessorPressureTest,
  QualitySummary,
  ReplayCard,
  ReportBullet,
  RiskItem,
  RiskRadarItem,
  SafeAnswerOutput,
} from "@/types/replay";

function formatBullets(list: ReportBullet[]): string {
  return list.map((b) => `- ${b.title}：${b.detail}`).join("\n");
}

function formatRisks(list: RiskItem[]): string {
  return list.map((r) => `- 追问：${r.risk}\n  原因：${r.reason}\n  准备：${r.suggestedPreparation}`).join("\n\n");
}

function formatRadar(items: RiskRadarItem[]): string {
  return items.map((r) => `- ${r.dimension}：${r.level} — ${r.reason}\n  建议：${r.action}`).join("\n\n");
}

function formatCards(items: EvidenceCard[]): string {
  return items.map((c, i) =>
    `【${i + 1}】${c.title}（${c.type} / ${c.id}）\n${c.content}\n  能力：${c.abilities.join("、")}\n  适用：${c.supportedQuestions.join("、")}\n  风险：${c.usageRisk}`
  ).join("\n\n");
}

function formatClaims(items: DiagnosisClaim[]): string {
  return items.map((c) => {
    const refs = c.evidenceRefs.map((r) => r.evidenceCardTitle).join("、") || "无";
    const missing = c.missingInfo.map((m) => m.field).join("、");
    return `- ${c.title}（置信度：${c.confidence}）\n  ${c.detail}\n  依据：${refs}${missing ? `\n  信息缺口：${missing}` : ""}`;
  }).join("\n\n");
}

function formatPressureTests(items: ProfessorPressureTest[]): string {
  return items.map((p) =>
    `- 风险表述：${p.riskyExpression}\n  可能追问：${p.likelyQuestion}\n  危险原因：${p.dangerReason}\n  安全回应：${p.safeResponse}`
  ).join("\n\n");
}

function formatSafeAnswer(answer: SafeAnswerOutput): string {
  const evidence = answer.usedEvidence.map((r) => r.evidenceCardTitle).join("、") || "无";
  const controls = answer.riskControls.join("；") || "无";
  return `【60秒版】\n${answer.answer60s || "未生成"}\n\n【30秒版】\n${answer.answer30s || "未生成"}\n\n使用证据：${evidence}\n风险控制：${controls}`;
}

function formatVerification(v: AnswerVerification): string {
  const issues = v.issues.map((i) => `- ${i.severity}：${i.reason}\n  建议：${i.suggestedFix}`).join("\n");
  return `结果：${v.passed ? "通过" : "需要修改"}\n${v.summary}\n${issues || "无明显风险"}${v.revisedAnswer ? `\n\n安全修正版：\n${v.revisedAnswer}` : ""}`;
}

function formatCard(c: ReplayCard): string {
  return `最大问题：${c.biggestProblem}
改进点：${c.keyImprovement}
回答公式：${c.nextFormula}
救场句：${c.rescueSentence}
下一题：${c.nextQuestion}`;
}

function formatQualitySummary(s: QualitySummary, m?: AnswerMaturity): string {
  const maturity = m ? `\n当前可训练层级：${m.level} ${m.label}\n${m.reason}\n升级方向：${m.nextUpgrade}` : "";
  const conflicts = s.conflictNotes.length > 0 ? `\n冲突说明：${s.conflictNotes.join("；")}` : "";
  return `一句话诊断：${s.oneSentenceDiagnosis}
材料召回：${s.evidenceRecallText}
安全校验：${s.answerSafety === "passed" ? "通过" : s.answerSafety === "needs_fix" ? "已修正" : "未检查"}
最大风险：${s.topRisk}${maturity}${conflicts}`;
}

function formatTrace(traces: AgentTraceItem[]): string {
  return traces.map((t) => `- ${t.agentName}（${t.status} ${t.durationMs ?? "?"}ms）: ${t.summary}`).join("\n");
}

export function formatPreCopyText(report: PreReplayReport): string {
  return `【面试复盘报告 - 面试前模拟】

一、质量摘要
${formatQualitySummary(report.qualitySummary, report.answerMaturity)}

二、问题真实意图
${report.questionIntent}

三、材料证据库
${formatCards(report.evidenceCards) || "无"}

四、材料召回率
应使用 ${report.materialRecall?.expectedCount ?? 0} 项 / 实际使用 ${report.materialRecall?.usedCount ?? 0} 项
${report.materialRecall?.recallSummary || ""}

五、临场回答诊断
${formatBullets(report.liveAnswerDiagnosis) || "无"}

六、临场损失分析
${formatBullets(report.liveLossAnalysis) || "无"}

七、临场差距诊断
${formatClaims(report.gapClaims) || "无"}

八、风险雷达
${formatRadar(report.riskRadar) || "无"}

九、证据依据
${formatClaims(report.evidenceClaims) || "无"}

十、真实性风险
${report.authenticityWarnings.map((w) => `- ${w.riskType}："${w.expression}" → ${w.saferAlternative}`).join("\n") || "无"}

十一、导师追问风险
${formatRisks(report.followUpRisks) || "无"}

十二、导师压力测试
${formatPressureTests(report.pressureTests) || "无"}

十三、安全融合回答
${formatSafeAnswer(report.safeAnswer)}

十四、回答安全校验
${formatVerification(report.answerVerification)}

十五、下次救场模板
${report.rescueTemplate}

十六、复盘卡片
${formatCard(report.replayCard)}

十七、多角色诊断链
${formatTrace(report.agentTrace)}`;
}

export function formatPostCopyText(report: PostReplayReport): string {
  const ranking = report.answerRanking
    .map((r) => `第${r.rank}名：${r.label} — ${r.reason}`)
    .join("\n");

  const reviews = report.versionReviews
    .map((v) => `【${v.label}】\n优点：${v.strengths.join("、")}\n问题：${v.problems.join("、")}\n保留：${v.keepParts.join("、")}\n避免：${v.avoidParts.join("、")}`)
    .join("\n\n");

  const diagnoses = report.sentenceDiagnosis
    .map((d) => `原文：${d.original}\n诊断：${d.diagnosis}\n建议：${d.suggestion}`)
    .join("\n\n");

  return `【面试复盘报告 - 面试后复盘】

一、质量摘要
${formatQualitySummary(report.qualitySummary, report.answerMaturity)}

二、问题真实意图
${report.questionIntent}

三、材料证据库
${formatCards(report.evidenceCards) || "无"}

四、材料召回率
应使用 ${report.materialRecall?.expectedCount ?? 0} 项 / 实际使用 ${report.materialRecall?.usedCount ?? 0} 项
${report.materialRecall?.recallSummary || ""}

五、回答综合排名
${ranking || "无"}

六、版本差异诊断
${formatClaims(report.versionClaims) || "无"}

七、各版本优缺点
${reviews || "无"}

八、逐句诊断
${diagnoses || "无"}

九、风险雷达
${formatRadar(report.riskRadar) || "无"}

十、证据依据
${formatClaims(report.evidenceClaims) || "无"}

十一、真实性风险
${report.authenticityWarnings.map((w) => `- ${w.riskType}："${w.expression}" → ${w.saferAlternative}`).join("\n") || "无"}

十二、导师可能追问
${formatRisks(report.followUpRisks) || "无"}

十三、导师压力测试
${formatPressureTests(report.pressureTests) || "无"}

十四、安全融合回答
${formatSafeAnswer(report.safeAnswer)}

十五、回答安全校验
${formatVerification(report.answerVerification)}

十六、可迁移回答公式
${report.transferableFormula}

十七、复盘卡片
${formatCard(report.replayCard)}

十八、多角色诊断链
${formatTrace(report.agentTrace)}`;
}
