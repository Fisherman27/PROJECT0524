import {
  AgentTraceItem,
  AnswerVerification,
  DiagnosisClaim,
  EvidenceCard,
  PostReplayReport,
  PreReplayReport,
  ProfessorPressureTest,
  ReplayCard,
  ReportBullet,
  RiskItem,
  RiskRadarItem,
  SafeAnswerOutput,
} from "@/types/replay";

function mdBullets(items: ReportBullet[]): string {
  if (items.length === 0) return "_本次未发现明显问题_\n\n";
  return items.map((b) => `- **${b.title}**：${b.detail}`).join("\n") + "\n\n";
}

function mdRisks(items: RiskItem[]): string {
  if (items.length === 0) return "_本次未发现明显风险_\n\n";
  return items
    .map((r) => `- **追问**：${r.risk}\n  - 原因：${r.reason}\n  - 准备：${r.suggestedPreparation}`)
    .join("\n\n") + "\n\n";
}

function mdRadar(items: RiskRadarItem[]): string {
  if (items.length === 0) return "_无_\n\n";
  return items.map((r) => `- **${r.dimension}**：${r.level} - ${r.reason}\n  - 建议：${r.action}`).join("\n\n") + "\n\n";
}

function mdCards(items: EvidenceCard[]): string {
  if (items.length === 0) return "_无_\n\n";
  return items.map((c, i) => `### ${i + 1}. ${c.title}（${c.type} / ${c.id}）\n\n${c.content}\n\n- 能力：${c.abilities.join("、")}\n- 适用：${c.supportedQuestions.join("、")}\n- 风险：${c.usageRisk}\n`).join("\n");
}

function mdClaims(items: DiagnosisClaim[]): string {
  if (items.length === 0) return "_本次没有可引用的材料依据_\n\n";
  return items.map((c) => {
    const refs = c.evidenceRefs.map((r) => r.evidenceCardTitle).join("、") || "无";
    const missing = c.missingInfo.map((m) => `  - ${m.field}：${m.howToSupplement || m.reason}`).join("\n");
    return `- **${c.title}**（置信度：${c.confidence}）\n  - 说明：${c.detail}\n  - 依据：${refs}${missing ? `\n  - 信息缺口：\n${missing}` : ""}`;
  }).join("\n\n") + "\n\n";
}

function mdPressureTests(items: ProfessorPressureTest[]): string {
  if (items.length === 0) return "_本次未发现明显追问压力点_\n\n";
  return items.map((p) => `- **风险表述**：${p.riskyExpression}\n  - 可能追问：${p.likelyQuestion}\n  - 危险原因：${p.dangerReason}\n  - 当前承接能力：${p.currentSupportLevel}\n  - 安全回应：${p.safeResponse}`).join("\n\n") + "\n\n";
}

function mdSafeAnswer(answer: SafeAnswerOutput): string {
  return `### 60 秒安全回答\n\n${answer.answer60s || "_未生成_"}\n\n### 30 秒压缩版\n\n${answer.answer30s || "_未生成_"}\n\n### 使用证据\n\n${answer.usedEvidence.map((r) => `- ${r.evidenceCardTitle}${r.reason ? `：${r.reason}` : ""}`).join("\n") || "_无_"}\n\n### 风险控制\n\n${answer.riskControls.map((r) => `- ${r}`).join("\n") || "_无_"}\n\n`;
}

function mdVerification(v: AnswerVerification): string {
  const issues = v.issues.map((i) => `- **${i.severity} / ${i.issueType}**：${i.reason}\n  - 原文：${i.originalText || "无"}\n  - 建议：${i.suggestedFix}`).join("\n\n");
  return `结果：**${v.passed ? "通过" : "需要修改"}**\n\n${v.summary}\n\n${issues || "_无明显风险_"}\n\n${v.revisedAnswer ? `### 安全修正版\n\n${v.revisedAnswer}\n\n` : ""}`;
}

function mdCard(c: ReplayCard): string {
  return `- **最大问题**：${c.biggestProblem}\n- **改进点**：${c.keyImprovement}\n- **回答公式**：${c.nextFormula}\n- **救场句**：${c.rescueSentence}\n- **下一题**：${c.nextQuestion}\n\n`;
}

function mdTrace(items: AgentTraceItem[]): string {
  if (items.length === 0) return "_无_\n\n";
  return items.map((t) => `- ${t.status === "success" ? "OK" : "FAIL"} ${t.agentName}（${t.durationMs != null ? Math.round(t.durationMs / 1000) + "s" : "?"}）: ${t.summary}`).join("\n") + "\n\n";
}

export function formatPreMarkdown(report: PreReplayReport): string {
  return `# 面试复盘报告：面试前模拟

---

## 一、问题真实意图
${report.questionIntent || "_未分析_"}

## 二、材料证据库
${mdCards(report.evidenceCards)}
## 三、材料召回率
应使用 ${report.materialRecall?.expectedCount ?? 0} 项 / 实际使用 ${report.materialRecall?.usedCount ?? 0} 项
${report.materialRecall?.recallSummary || ""}

## 四、证据依据
${mdClaims(report.evidenceClaims)}
## 五、临场回答诊断
${mdBullets(report.liveAnswerDiagnosis)}
## 六、临场损失分析
${mdBullets(report.liveLossAnalysis)}
## 七、风险雷达
${mdRadar(report.riskRadar)}
## 八、真实性风险
${report.authenticityWarnings.map((w) => `- **${w.riskType}**：~~${w.expression}~~ -> ${w.saferAlternative}\n  - ${w.reason}`).join("\n\n") + "\n\n" || "_无_\n\n"}
## 九、导师追问风险
${mdRisks(report.followUpRisks)}
## 十、导师压力测试
${mdPressureTests(report.pressureTests)}
## 十一、安全融合回答
${mdSafeAnswer(report.safeAnswer)}
## 十二、回答安全校验
${mdVerification(report.answerVerification)}
## 十三、下次救场模板
${report.rescueTemplate || "_未生成_"}

## 十四、复盘卡片
${mdCard(report.replayCard)}
## 十五、多角色诊断链
${mdTrace(report.agentTrace)}
---

*报告由 Interview Replay 多角色诊断引擎生成*`;
}

export function formatPostMarkdown(report: PostReplayReport): string {
  const ranking = report.answerRanking.length > 0
    ? report.answerRanking.sort((a, b) => a.rank - b.rank).map((r) => `${r.rank}. **${r.label}** - ${r.reason}`).join("\n")
    : "_暂无排名_";
  const reviews = report.versionReviews.length > 0
    ? report.versionReviews.map((v) =>
        `### ${v.label}\n\n- **优点**：${v.strengths.join("、") || "无"}\n- **问题**：${v.problems.join("、") || "无"}\n- **保留**：${v.keepParts.join("、") || "无"}\n- **避免**：${v.avoidParts.join("、") || "无"}\n`).join("\n")
    : "_暂无分析_";
  const diagnoses = report.sentenceDiagnosis.length > 0
    ? report.sentenceDiagnosis.map((d) => `| ${d.original} | ${d.diagnosis} | ${d.suggestion} |`).join("\n")
    : "";

  return `# 面试复盘报告：面试后复盘

---

## 一、问题真实意图
${report.questionIntent || "_未分析_"}

## 二、材料证据库
${mdCards(report.evidenceCards)}
## 三、材料召回率
应使用 ${report.materialRecall?.expectedCount ?? 0} 项 / 实际使用 ${report.materialRecall?.usedCount ?? 0} 项
${report.materialRecall?.recallSummary || ""}

## 四、证据依据
${mdClaims(report.evidenceClaims)}
## 五、回答综合排名
${ranking}

## 六、各版本优缺点
${reviews}

## 七、逐句诊断
${diagnoses ? `| 原句 | 诊断 | 建议 |\n|------|------|------|\n${diagnoses}\n` : "_暂无逐句诊断_\n"}

## 八、风险雷达
${mdRadar(report.riskRadar)}
## 九、真实性风险
${report.authenticityWarnings.map((w) => `- **${w.riskType}**：~~${w.expression}~~ -> ${w.saferAlternative}`).join("\n\n") + "\n\n" || "_无_\n\n"}
## 十、导师可能追问
${mdRisks(report.followUpRisks)}
## 十一、导师压力测试
${mdPressureTests(report.pressureTests)}
## 十二、安全融合回答
${mdSafeAnswer(report.safeAnswer)}
## 十三、回答安全校验
${mdVerification(report.answerVerification)}
## 十四、可迁移回答公式
${report.transferableFormula || "_未生成_"}

## 十五、复盘卡片
${mdCard(report.replayCard)}
## 十六、多角色诊断链
${mdTrace(report.agentTrace)}
---

*报告由 Interview Replay 多角色诊断引擎生成*`;
}
