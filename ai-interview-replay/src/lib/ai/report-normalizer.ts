import { PreReplayReport, PostReplayReport } from "@/types/replay";

export function normalizePreReport(raw: string): PreReplayReport {
  try {
    const parsed = JSON.parse(raw) as PreReplayReport;
    return {
      questionIntent: parsed.questionIntent || "",
      evidenceCards: Array.isArray(parsed.evidenceCards) ? parsed.evidenceCards : [],
      materialRecall: parsed.materialRecall || {
        expectedCount: 0, usedCount: 0, usedEvidence: [], missingEvidence: [], recallSummary: "", improvementHint: "",
      },
      liveAnswerDiagnosis: Array.isArray(parsed.liveAnswerDiagnosis) ? parsed.liveAnswerDiagnosis : [],
      calmAnswerImprovements: Array.isArray(parsed.calmAnswerImprovements) ? parsed.calmAnswerImprovements : [],
      liveLossAnalysis: Array.isArray(parsed.liveLossAnalysis) ? parsed.liveLossAnalysis : [],
      missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence : [],
      gapClaims: Array.isArray(parsed.gapClaims) ? parsed.gapClaims : [],
      evidenceClaims: Array.isArray(parsed.evidenceClaims) ? parsed.evidenceClaims : [],
      riskRadar: Array.isArray(parsed.riskRadar) ? parsed.riskRadar : [],
      authenticityWarnings: Array.isArray(parsed.authenticityWarnings) ? parsed.authenticityWarnings : [],
      followUpRisks: Array.isArray(parsed.followUpRisks) ? parsed.followUpRisks : [],
      pressureTests: Array.isArray(parsed.pressureTests) ? parsed.pressureTests : [],
      bestMergedAnswer: parsed.bestMergedAnswer || "",
      safeAnswer: parsed.safeAnswer || { answer30s: "", answer60s: parsed.bestMergedAnswer || "", usedEvidence: [], riskControls: [] },
      answerVerification: parsed.answerVerification || { passed: true, summary: "未运行安全校验", issues: [] },
      qualitySummary: parsed.qualitySummary || { oneSentenceDiagnosis: "未生成诊断", topRisk: "未知", topMissingInfo: [], evidenceRecallText: "0/0", answerSafety: "not_checked", conflictNotes: [] },
      answerMaturity: parsed.answerMaturity,
      rescueTemplate: parsed.rescueTemplate || "",
      nextPracticeAdvice: Array.isArray(parsed.nextPracticeAdvice) ? parsed.nextPracticeAdvice : [],
      replayCard: parsed.replayCard || { biggestProblem: "", keyImprovement: "", nextFormula: "", rescueSentence: "", nextQuestion: "" },
      agentTrace: Array.isArray(parsed.agentTrace) ? parsed.agentTrace : [],
    };
  } catch {
    throw new Error("MODEL_RESPONSE_INVALID");
  }
}

export function normalizePostReport(raw: string): PostReplayReport {
  try {
    const parsed = JSON.parse(raw) as PostReplayReport;
    return {
      questionIntent: parsed.questionIntent || "",
      evidenceCards: Array.isArray(parsed.evidenceCards) ? parsed.evidenceCards : [],
      materialRecall: parsed.materialRecall || {
        expectedCount: 0, usedCount: 0, usedEvidence: [], missingEvidence: [], recallSummary: "", improvementHint: "",
      },
      evidenceClaims: Array.isArray(parsed.evidenceClaims) ? parsed.evidenceClaims : [],
      answerRanking: Array.isArray(parsed.answerRanking) ? parsed.answerRanking : [],
      versionReviews: Array.isArray(parsed.versionReviews) ? parsed.versionReviews : [],
      versionClaims: Array.isArray(parsed.versionClaims) ? parsed.versionClaims : [],
      sentenceDiagnosis: Array.isArray(parsed.sentenceDiagnosis) ? parsed.sentenceDiagnosis : [],
      vagueAndOverpackagingRisks: Array.isArray(parsed.vagueAndOverpackagingRisks) ? parsed.vagueAndOverpackagingRisks : [],
      riskRadar: Array.isArray(parsed.riskRadar) ? parsed.riskRadar : [],
      authenticityWarnings: Array.isArray(parsed.authenticityWarnings) ? parsed.authenticityWarnings : [],
      followUpRisks: Array.isArray(parsed.followUpRisks) ? parsed.followUpRisks : [],
      pressureTests: Array.isArray(parsed.pressureTests) ? parsed.pressureTests : [],
      bestMergedAnswer: parsed.bestMergedAnswer || "",
      safeAnswer: parsed.safeAnswer || { answer30s: "", answer60s: parsed.bestMergedAnswer || "", usedEvidence: [], riskControls: [] },
      answerVerification: parsed.answerVerification || { passed: true, summary: "未运行安全校验", issues: [] },
      qualitySummary: parsed.qualitySummary || { oneSentenceDiagnosis: "未生成诊断", topRisk: "未知", topMissingInfo: [], evidenceRecallText: "0/0", answerSafety: "not_checked", conflictNotes: [] },
      answerMaturity: parsed.answerMaturity,
      transferableFormula: parsed.transferableFormula || "",
      nextInterviewChecklist: Array.isArray(parsed.nextInterviewChecklist) ? parsed.nextInterviewChecklist : [],
      replayCard: parsed.replayCard || { biggestProblem: "", keyImprovement: "", nextFormula: "", rescueSentence: "", nextQuestion: "" },
      agentTrace: Array.isArray(parsed.agentTrace) ? parsed.agentTrace : [],
    };
  } catch {
    throw new Error("MODEL_RESPONSE_INVALID");
  }
}

export function sanitizeJsonBlock(text: string): string {
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return cleaned;
  return cleaned.slice(start, end + 1);
}
