import { PreReplayReport, PostReplayReport } from "@/types/replay";

export function normalizePreReport(raw: string): PreReplayReport {
  try {
    const parsed = JSON.parse(raw) as PreReplayReport;
    return {
      questionIntent: parsed.questionIntent || "",
      liveAnswerDiagnosis: Array.isArray(parsed.liveAnswerDiagnosis) ? parsed.liveAnswerDiagnosis : [],
      calmAnswerImprovements: Array.isArray(parsed.calmAnswerImprovements) ? parsed.calmAnswerImprovements : [],
      liveLossAnalysis: Array.isArray(parsed.liveLossAnalysis) ? parsed.liveLossAnalysis : [],
      missingEvidence: Array.isArray(parsed.missingEvidence) ? parsed.missingEvidence : [],
      followUpRisks: Array.isArray(parsed.followUpRisks) ? parsed.followUpRisks : [],
      bestMergedAnswer: parsed.bestMergedAnswer || "",
      rescueTemplate: parsed.rescueTemplate || "",
      nextPracticeAdvice: Array.isArray(parsed.nextPracticeAdvice) ? parsed.nextPracticeAdvice : [],
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
      answerRanking: Array.isArray(parsed.answerRanking) ? parsed.answerRanking : [],
      versionReviews: Array.isArray(parsed.versionReviews) ? parsed.versionReviews : [],
      sentenceDiagnosis: Array.isArray(parsed.sentenceDiagnosis) ? parsed.sentenceDiagnosis : [],
      vagueAndOverpackagingRisks: Array.isArray(parsed.vagueAndOverpackagingRisks)
        ? parsed.vagueAndOverpackagingRisks
        : [],
      followUpRisks: Array.isArray(parsed.followUpRisks) ? parsed.followUpRisks : [],
      bestMergedAnswer: parsed.bestMergedAnswer || "",
      transferableFormula: parsed.transferableFormula || "",
      nextInterviewChecklist: Array.isArray(parsed.nextInterviewChecklist)
        ? parsed.nextInterviewChecklist
        : [],
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
