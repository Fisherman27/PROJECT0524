import { PreReplayReport, PostReplayReport, ReportBullet, RiskItem } from "@/types/replay";

function mdBullets(items: ReportBullet[]): string {
  if (items.length === 0) return "_本次未发现明显问题_\n\n";
  return items.map((b) => `- **${b.title}**：${b.detail}`).join("\n") + "\n\n";
}

function mdRisks(items: RiskItem[]): string {
  if (items.length === 0) return "_本次未发现明显风险_\n\n";
  return items
    .map(
      (r) => `- **追问**：${r.risk}\n  - 原因：${r.reason}\n  - 准备：${r.suggestedPreparation}`
    )
    .join("\n\n") + "\n\n";
}

export function formatPreMarkdown(report: PreReplayReport): string {
  return `# 面试复盘报告：面试前模拟

---

## 一、问题真实意图
${report.questionIntent || "_未分析_"}

## 二、临场回答诊断
${mdBullets(report.liveAnswerDiagnosis)}
## 三、冷静回答改进点
${mdBullets(report.calmAnswerImprovements)}
## 四、临场损失分析
${mdBullets(report.liveLossAnalysis)}
## 五、材料证据遗漏
${mdBullets(report.missingEvidence)}
## 六、导师追问风险
${mdRisks(report.followUpRisks)}
## 七、最佳融合回答
${report.bestMergedAnswer || "_未生成_"}

## 八、下次救场模板
${report.rescueTemplate || "_未生成_"}

## 九、下一次练习建议
${mdBullets(report.nextPracticeAdvice)}
---

*报告由 Interview Replay 生成*`;
}

export function formatPostMarkdown(report: PostReplayReport): string {
  const ranking = report.answerRanking.length > 0
    ? report.answerRanking
        .sort((a, b) => a.rank - b.rank)
        .map((r) => `${r.rank}. **${r.label}** — ${r.reason}`)
        .join("\n")
    : "_暂无排名_";

  const reviews = report.versionReviews.length > 0
    ? report.versionReviews
        .map(
          (v) =>
            `### ${v.label}\n\n` +
            `- **优点**：${v.strengths.join("、") || "无"}\n` +
            `- **问题**：${v.problems.join("、") || "无"}\n` +
            `- **保留**：${v.keepParts.join("、") || "无"}\n` +
            `- **避免**：${v.avoidParts.join("、") || "无"}\n`
        )
        .join("\n")
    : "_暂无分析_";

  const diagnoses = report.sentenceDiagnosis.length > 0
    ? report.sentenceDiagnosis
        .map(
          (d) =>
            `| ${d.original} | ${d.diagnosis} | ${d.suggestion} |`
        )
        .join("\n")
    : "";

  return `# 面试复盘报告：面试后复盘

---

## 一、问题真实意图
${report.questionIntent || "_未分析_"}

## 二、回答综合排名
${ranking}

## 三、各版本优缺点
${reviews}

## 四、逐句诊断
${diagnoses
  ? `| 原句 | 诊断 | 建议 |\n|------|------|------|\n${diagnoses}\n`
  : "_暂无逐句诊断_\n"}

## 五、空泛表达与过度包装风险
${mdRisks(report.vagueAndOverpackagingRisks)}
## 六、导师可能追问
${mdRisks(report.followUpRisks)}
## 七、最佳融合回答
${report.bestMergedAnswer || "_未生成_"}

## 八、可迁移回答公式
${report.transferableFormula || "_未生成_"}

## 九、下一场面试准备清单
${report.nextInterviewChecklist.length > 0
  ? report.nextInterviewChecklist.map((item, i) => `${i + 1}. ${item}`).join("\n")
  : "_暂无_"}

---

*报告由 Interview Replay 生成*`;
}
