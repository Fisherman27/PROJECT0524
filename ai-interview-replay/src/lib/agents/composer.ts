import {
  PreReplayReport, PostReplayReport, AgentTraceItem,
  DiagnosisClaim, ProfessorPressureTest, SafeAnswerOutput,
  AnswerVerification, AnswerMaturity, AnswerMaturityLevel,
  QualitySummary, MissingInfoItem, RiskRadarItem, MaterialRecall,
} from "@/types/replay";
import {
  MaterialAgentOutput,
  IntentAgentOutput,
  EvidenceAgentOutput,
  ProfessorAgentOutput,
  GapAgentOutput,
  DiffAgentOutput,
  SynthesizerAgentOutput,
  VerifierAgentOutput,
  TrainingAgentOutput,
} from "./types";

export function assessMaturity(
  materialRecall: MaterialRecall,
  evidenceClaims: DiagnosisClaim[],
  pressureTests: ProfessorPressureTest[],
  verification: AnswerVerification,
): AnswerMaturity {
  const usedCount = materialRecall.usedCount;
  const expectedCount = materialRecall.expectedCount;
  const evidenceRatio = expectedCount > 0 ? usedCount / expectedCount : 0;
  const hasEvidence = evidenceRatio >= 0.5;
  const hasProblemAwareness = evidenceClaims.length > 0;
  const hasSafetyPass = verification.passed;
  const isContributionClear = pressureTests.length === 0 || !pressureTests.some((p) =>
    p.dangerReason.includes("贡献") || p.dangerReason.includes("夸大") || p.dangerReason.includes("包装") || p.dangerReason.includes("边界")
  );
  const allSupported = pressureTests.length > 0 && pressureTests.every((p) => p.currentSupportLevel !== "weak");

  if (!hasEvidence && !hasProblemAwareness) {
    return { level: "L1", label: "模板表达", reason: "回答缺少个人经历和问题意识，停留在泛泛兴趣和前景判断层面。", nextUpgrade: "请补充至少一段个人项目或研究经历，并在回答中明确这段经历让你意识到什么具体问题。" };
  }
  if (hasEvidence && !hasProblemAwareness) {
    return { level: "L2", label: "有经历但缺少问题意识", reason: "回答提到了个人经历，但没有从中提炼出具体科研问题或方向。", nextUpgrade: "请从经历中找出一个值得继续探索的问题，并说明为什么这个问题值得研究。" };
  }
  if (hasEvidence && hasProblemAwareness && !isContributionClear) {
    return { level: "L3", label: "有经历+有问题意识", reason: "回答有经历和问题意识，但个人贡献边界尚不够清晰，可能被追问。", nextUpgrade: "请明确说明你在这个项目/研究中的具体角色和独立贡献，以及哪些是团队成果。" };
  }
  if (hasEvidence && hasProblemAwareness && isContributionClear && hasSafetyPass && allSupported) {
    return { level: "L5", label: "边界清晰+可承接追问+有未来计划", reason: "回答在真实性、可承接性、方向匹配和风险控制方面均表现稳健。", nextUpgrade: "可继续针对压力质疑和贡献边界类问题进行专项训练。" };
  }
  if (hasEvidence && hasProblemAwareness && isContributionClear && hasSafetyPass) {
    return { level: "L4", label: "有经历+问题意识+方向匹配", reason: "回答包含具体经历和研究问题，个人贡献边界较为清晰，回答能通过安全校验。", nextUpgrade: "可进一步增强与目标导师/实验室方向的匹配表述，并补充未来研究计划。" };
  }
  return { level: "L2", label: "有经历但缺少问题意识", reason: "回答有经历但诊断信息不足，暂无法可靠判断成熟度。", nextUpgrade: "请补充更多材料分析结果以获得更精准的成熟度评估。" };
}

function resolveConflicts(
  evidenceClaims: DiagnosisClaim[],
  pressureTests: ProfessorPressureTest[],
  safeAnswer: SafeAnswerOutput,
  verification: AnswerVerification,
): string[] {
  const notes: string[] = [];

  // Verifier high severity issues take priority
  const highIssues = verification.issues.filter((i) => i.severity === "high");
  if (highIssues.length > 0) {
    notes.push(`安全校验发现 ${highIssues.length} 个高严重性问题：${highIssues.map((i) => i.reason).join("；")}`);
  }

  // Check if evidence mapper found missing evidence but synthesizer still used it
  const missingTitles = evidenceClaims
    .filter((c) => c.confidence === "low" || c.missingInfo.length > 0)
    .map((c) => c.title);
  const usedTitles = safeAnswer.usedEvidence.map((r) => r.evidenceCardTitle);
  const conflictEvidence = usedTitles.filter((t) => missingTitles.some((m) => t.includes(m) || m.includes(t)));
  if (conflictEvidence.length > 0) {
    notes.push(`证据匹配器对部分材料召回率判断为低置信度，但最终回答仍引用了相关证据："${conflictEvidence.join("、")}"，建议补充这些材料的具体信息以提升可信度。`);
  }

  // Safety takes priority over maturity
  if (!verification.passed && verification.revisedAnswer) {
    notes.push("最终回答被安全校验标记为需要修改，已采用修正版以确保回答可承接。");
  }

  // If pressureTests have high severity and safeAnswer still mentions risky content
  const highRisks = pressureTests.filter((p) => p.currentSupportLevel === "weak");
  if (highRisks.length > 0) {
    notes.push(`${highRisks.length} 项风险当前承接能力为"弱"，建议用户优先补充相关经历或降低表述。`);
  }

  return notes;
}

export function buildQualitySummary(
  evidence: EvidenceAgentOutput,
  professor: ProfessorAgentOutput,
  synthesizer: SynthesizerAgentOutput,
  verifier: VerifierAgentOutput,
  gapOrDiffClaims: DiagnosisClaim[],
): QualitySummary {
  const allClaims = [
    ...(evidence.evidenceClaims || []),
    ...(gapOrDiffClaims || []),
  ];

  const topRisks = professor.pressureTests
    .filter((p) => p.currentSupportLevel === "weak")
    .sort((a, b) => (b.currentSupportLevel === "weak" ? 1 : 0) - (a.currentSupportLevel === "weak" ? 1 : 0));

  const topRisk = topRisks.length > 0
    ? topRisks[0].riskyExpression
    : (professor.riskRadar.filter((r) => r.level === "高")[0]?.dimension || "无明显高风险");

  const topMissingInfo: MissingInfoItem[] = [
    ...evidence.evidenceClaims.flatMap((c) => c.missingInfo),
    ...professor.pressureTests.flatMap((p) => p.missingInfo),
    ...gapOrDiffClaims.flatMap((c) => c.missingInfo),
  ].slice(0, 3);

  const oneSentenceDiagnosis = evidence.materialRecall.expectedCount > 0 && evidence.materialRecall.usedCount === 0
    ? "你不是没有内容，而是临场没有调用自己的项目证据，导致回答像模板。"
    : (allClaims.length > 0 ? allClaims[0].detail : "请补充更多背景材料以获取更精准的诊断。");

  const answerSafety: QualitySummary["answerSafety"] = verifier.verification.passed
    ? "passed"
    : (verifier.verification.revisedAnswer ? "needs_fix" : "not_checked");

  const maturity = assessMaturity(
    evidence.materialRecall,
    evidence.evidenceClaims,
    professor.pressureTests,
    verifier.verification,
  );

  const conflictNotes = resolveConflicts(
    evidence.evidenceClaims,
    professor.pressureTests,
    synthesizer.safeAnswer,
    verifier.verification,
  );

  return {
    oneSentenceDiagnosis,
    topRisk,
    topMissingInfo,
    evidenceRecallText: `${evidence.materialRecall.usedCount}/${evidence.materialRecall.expectedCount}`,
    answerSafety,
    maturity,
    conflictNotes,
  };
}

export function composePreReport(
  material: MaterialAgentOutput,
  intent: IntentAgentOutput,
  evidence: EvidenceAgentOutput,
  professor: ProfessorAgentOutput,
  gap: GapAgentOutput,
  synthesizer: SynthesizerAgentOutput,
  verifier: VerifierAgentOutput,
  training: TrainingAgentOutput,
  agentTrace: AgentTraceItem[],
  qualitySummary: QualitySummary,
  maturity: AnswerMaturity,
): PreReplayReport {
  const finalAnswer = verifier.verification.revisedAnswer || synthesizer.safeAnswer.answer || synthesizer.bestMergedAnswer;
  return {
    questionIntent: intent.questionIntent,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    liveAnswerDiagnosis: gap.liveAnswerDiagnosis,
    calmAnswerImprovements: gap.calmAnswerImprovements,
    liveLossAnalysis: gap.liveLossAnalysis,
    missingEvidence: evidence.missingEvidence,
    gapClaims: gap.gapClaims,
    evidenceClaims: evidence.evidenceClaims,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    followUpRisks: professor.followUpRisks,
    pressureTests: professor.pressureTests,
    bestMergedAnswer: finalAnswer,
    safeAnswer: synthesizer.safeAnswer,
    answerVerification: verifier.verification,
    qualitySummary,
    answerMaturity: maturity,
    rescueTemplate: training.rescueTemplate || "",
    nextPracticeAdvice: training.nextPracticeAdvice || [],
    replayCard: training.replayCard,
    agentTrace,
  };
}

export function composePostReport(
  material: MaterialAgentOutput,
  intent: IntentAgentOutput,
  evidence: EvidenceAgentOutput,
  professor: ProfessorAgentOutput,
  diff: DiffAgentOutput,
  synthesizer: SynthesizerAgentOutput,
  verifier: VerifierAgentOutput,
  training: TrainingAgentOutput,
  agentTrace: AgentTraceItem[],
  qualitySummary: QualitySummary,
  maturity: AnswerMaturity,
): PostReplayReport {
  const finalAnswer = verifier.verification.revisedAnswer || synthesizer.safeAnswer.answer || synthesizer.bestMergedAnswer;
  return {
    questionIntent: intent.questionIntent,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    evidenceClaims: evidence.evidenceClaims,
    answerRanking: diff.answerRanking,
    versionReviews: diff.versionReviews,
    versionClaims: diff.versionClaims,
    sentenceDiagnosis: diff.sentenceDiagnosis,
    vagueAndOverpackagingRisks: professor.followUpRisks.map((r) => ({
      risk: r.risk,
      reason: r.reason,
      suggestedPreparation: r.suggestedPreparation,
    })),
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    followUpRisks: professor.followUpRisks,
    pressureTests: professor.pressureTests,
    bestMergedAnswer: finalAnswer,
    safeAnswer: synthesizer.safeAnswer,
    answerVerification: verifier.verification,
    qualitySummary,
    answerMaturity: maturity,
    transferableFormula: training.transferableFormula || "",
    nextInterviewChecklist: training.nextInterviewChecklist || [],
    replayCard: training.replayCard,
    agentTrace,
  };
}
