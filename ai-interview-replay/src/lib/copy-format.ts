import { PreReplayReport, PostReplayReport, RiskItem, ReportBullet } from "@/types/replay";

function formatBullets(list: ReportBullet[]): string {
  return list.map((b) => `- ${b.title}：${b.detail}`).join("\n");
}

function formatRisks(list: RiskItem[]): string {
  return list.map((r) => `- 追问：${r.risk}\n  原因：${r.reason}\n  准备：${r.suggestedPreparation}`).join("\n\n");
}

export function formatPreCopyText(report: PreReplayReport): string {
  return `【面试复盘报告 - 面试前模拟】

一、问题真实意图
${report.questionIntent}

二、临场回答诊断
${formatBullets(report.liveAnswerDiagnosis) || "无"}

三、冷静回答改进点
${formatBullets(report.calmAnswerImprovements) || "无"}

四、临场损失分析
${formatBullets(report.liveLossAnalysis) || "无"}

五、材料证据遗漏
${formatBullets(report.missingEvidence) || "无"}

六、导师追问风险
${formatRisks(report.followUpRisks) || "无"}

七、最佳融合回答
${report.bestMergedAnswer}

八、下次救场模板
${report.rescueTemplate}

九、下一次练习建议
${formatBullets(report.nextPracticeAdvice) || "无"}`;
}

export function formatPostCopyText(report: PostReplayReport): string {
  const ranking = report.answerRanking
    .map((r) => `第${r.rank}名：${r.label} — ${r.reason}`)
    .join("\n");

  const reviews = report.versionReviews
    .map((v) => {
      return `【${v.label}】
优点：${v.strengths.join("、")}
问题：${v.problems.join("、")}
保留：${v.keepParts.join("、")}
避免：${v.avoidParts.join("、")}`;
    })
    .join("\n\n");

  const diagnoses = report.sentenceDiagnosis
    .map((d) => `原文：${d.original}\n诊断：${d.diagnosis}\n建议：${d.suggestion}`)
    .join("\n\n");

  return `【面试复盘报告 - 面试后复盘】

一、问题真实意图
${report.questionIntent}

二、回答综合排名
${ranking || "无"}

三、各版本优缺点
${reviews || "无"}

四、逐句诊断
${diagnoses || "无"}

五、空泛表达与过度包装风险
${formatRisks(report.vagueAndOverpackagingRisks) || "无"}

六、导师可能追问
${formatRisks(report.followUpRisks) || "无"}

七、最佳融合回答
${report.bestMergedAnswer}

八、可迁移回答公式
${report.transferableFormula}

九、下一场面试准备清单
${report.nextInterviewChecklist.map((item, i) => `${i + 1}. ${item}`).join("\n") || "无"}`;
}
