import { PreReplayReport, PostReplayReport, RiskItem, ReportBullet, RiskRadarItem, EvidenceCard, ReplayCard, AgentTraceItem } from "@/types/replay";

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
    `【${i + 1}】${c.title}（${c.type}）\n${c.content}\n  能力：${c.abilities.join("、")}\n  适用：${c.supportedQuestions.join("、")}\n  风险：${c.usageRisk}`
  ).join("\n\n");
}

function formatCard(c: ReplayCard): string {
  return `最大问题：${c.biggestProblem}
改进点：${c.keyImprovement}
回答公式：${c.nextFormula}
救场句：${c.rescueSentence}
下一题：${c.nextQuestion}`;
}

function formatTrace(traces: AgentTraceItem[]): string {
  return traces.map((t) => `- ${t.agentName}（${t.status} ${t.durationMs ?? "?"}ms）: ${t.summary}`).join("\n");
}

export function formatPreCopyText(report: PreReplayReport): string {
  return `【面试复盘报告 - 面试前模拟】

一、问题真实意图
${report.questionIntent}

二、材料证据库
${formatCards(report.evidenceCards) || "无"}

三、材料召回率
应使用 ${report.materialRecall?.expectedCount ?? 0} 项 / 实际使用 ${report.materialRecall?.usedCount ?? 0} 项
${report.materialRecall?.recallSummary || ""}

四、临场回答诊断
${formatBullets(report.liveAnswerDiagnosis) || "无"}

五、临场损失分析
${formatBullets(report.liveLossAnalysis) || "无"}

六、风险雷达
${formatRadar(report.riskRadar) || "无"}

七、真实性风险
${report.authenticityWarnings.map((w) => `- ${w.riskType}：“${w.expression}” → ${w.saferAlternative}`).join("\n") || "无"}

八、导师追问风险
${formatRisks(report.followUpRisks) || "无"}

九、最佳融合回答
${report.bestMergedAnswer}

十、下次救场模板
${report.rescueTemplate}

十一、复盘卡片
${formatCard(report.replayCard)}

十二、多角色诊断链
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

一、问题真实意图
${report.questionIntent}

二、材料证据库
${formatCards(report.evidenceCards) || "无"}

三、材料召回率
应使用 ${report.materialRecall?.expectedCount ?? 0} 项 / 实际使用 ${report.materialRecall?.usedCount ?? 0} 项
${report.materialRecall?.recallSummary || ""}

四、回答综合排名
${ranking || "无"}

五、各版本优缺点
${reviews || "无"}

六、逐句诊断
${diagnoses || "无"}

七、风险雷达
${formatRadar(report.riskRadar) || "无"}

八、真实性风险
${report.authenticityWarnings.map((w) => `- ${w.riskType}：“${w.expression}” → ${w.saferAlternative}`).join("\n") || "无"}

九、导师可能追问
${formatRisks(report.followUpRisks) || "无"}

十、最佳融合回答
${report.bestMergedAnswer}

十一、可迁移回答公式
${report.transferableFormula}

十二、复盘卡片
${formatCard(report.replayCard)}

十三、多角色诊断链
${formatTrace(report.agentTrace)}`;
}
