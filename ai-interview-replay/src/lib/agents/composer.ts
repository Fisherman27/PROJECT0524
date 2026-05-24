import { PreReplayReport, PostReplayReport, AgentTraceItem } from "@/types/replay";
import {
  MaterialAgentOutput,
  IntentAgentOutput,
  EvidenceAgentOutput,
  ProfessorAgentOutput,
  GapAgentOutput,
  DiffAgentOutput,
  SynthesizerAgentOutput,
  TrainingAgentOutput,
} from "./types";

export function composePreReport(
  material: MaterialAgentOutput,
  intent: IntentAgentOutput,
  evidence: EvidenceAgentOutput,
  professor: ProfessorAgentOutput,
  gap: GapAgentOutput,
  synthesizer: SynthesizerAgentOutput,
  training: TrainingAgentOutput,
  agentTrace: AgentTraceItem[]
): PreReplayReport {
  return {
    questionIntent: intent.questionIntent,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    liveAnswerDiagnosis: gap.liveAnswerDiagnosis,
    calmAnswerImprovements: gap.calmAnswerImprovements,
    liveLossAnalysis: gap.liveLossAnalysis,
    missingEvidence: evidence.missingEvidence,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    followUpRisks: professor.followUpRisks,
    bestMergedAnswer: synthesizer.bestMergedAnswer,
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
  training: TrainingAgentOutput,
  agentTrace: AgentTraceItem[]
): PostReplayReport {
  return {
    questionIntent: intent.questionIntent,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
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
    bestMergedAnswer: synthesizer.bestMergedAnswer,
    transferableFormula: training.transferableFormula || "",
    nextInterviewChecklist: training.nextInterviewChecklist || [],
    replayCard: training.replayCard,
    agentTrace,
  };
}
