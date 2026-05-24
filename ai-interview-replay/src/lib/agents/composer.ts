import { PreReplayReport, PostReplayReport, AgentTraceItem } from "@/types/replay";
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

export function composePreReport(
  material: MaterialAgentOutput,
  intent: IntentAgentOutput,
  evidence: EvidenceAgentOutput,
  professor: ProfessorAgentOutput,
  gap: GapAgentOutput,
  synthesizer: SynthesizerAgentOutput,
  verifier: VerifierAgentOutput,
  training: TrainingAgentOutput,
  agentTrace: AgentTraceItem[]
): PreReplayReport {
  const finalAnswer = verifier.verification.revisedAnswer || synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer;
  return {
    questionIntent: intent.questionIntent,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    liveAnswerDiagnosis: gap.liveAnswerDiagnosis,
    calmAnswerImprovements: gap.calmAnswerImprovements,
    liveLossAnalysis: gap.liveLossAnalysis,
    missingEvidence: evidence.missingEvidence,
    evidenceClaims: evidence.evidenceClaims,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    followUpRisks: professor.followUpRisks,
    pressureTests: professor.pressureTests,
    bestMergedAnswer: finalAnswer,
    safeAnswer: {
      ...synthesizer.safeAnswer,
      answer60s: finalAnswer,
    },
    answerVerification: verifier.verification,
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
  agentTrace: AgentTraceItem[]
): PostReplayReport {
  const finalAnswer = verifier.verification.revisedAnswer || synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer;
  return {
    questionIntent: intent.questionIntent,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    evidenceClaims: evidence.evidenceClaims,
    answerRanking: diff.answerRanking,
    versionReviews: diff.versionReviews,
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
    safeAnswer: {
      ...synthesizer.safeAnswer,
      answer60s: finalAnswer,
    },
    answerVerification: verifier.verification,
    transferableFormula: training.transferableFormula || "",
    nextInterviewChecklist: training.nextInterviewChecklist || [],
    replayCard: training.replayCard,
    agentTrace,
  };
}
