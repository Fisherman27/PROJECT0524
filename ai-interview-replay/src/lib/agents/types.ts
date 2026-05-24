import {
  EvidenceCard,
  MaterialRecall,
  RiskRadarItem,
  RiskItem,
  AuthenticityWarning,
  ReplayCard,
  ReportBullet,
  SentenceDiagnosis,
  DiagnosisClaim,
  ProfessorPressureTest,
  SafeAnswerOutput,
  AnswerVerification,
} from "@/types/replay";

// Agent input/output context shared between agents
export type AgentContext = {
  question: string;
  backgroundMaterials: string;
  interviewType: string;
  targetDirection: string;
  targetSchool?: string;
};

export type MaterialAgentOutput = {
  evidenceCards: EvidenceCard[];
  summary: string;
};

export type IntentAgentOutput = {
  questionIntent: string;
  evaluationFocus: string[];
  idealAnswerLayers: string[];
  commonPitfalls: string[];
  summary: string;
};

export type EvidenceAgentOutput = {
  materialRecall: MaterialRecall;
  missingEvidence: ReportBullet[];
  evidenceClaims: DiagnosisClaim[];
  summary: string;
};

export type ProfessorAgentOutput = {
  riskRadar: RiskRadarItem[];
  followUpRisks: RiskItem[];
  authenticityWarnings: AuthenticityWarning[];
  pressureTests: ProfessorPressureTest[];
  summary: string;
};

export type GapAgentOutput = {
  liveAnswerDiagnosis: ReportBullet[];
  calmAnswerImprovements: ReportBullet[];
  liveLossAnalysis: ReportBullet[];
  gapClaims: DiagnosisClaim[];
  summary: string;
};

export type DiffAgentOutput = {
  answerRanking: Array<{ label: string; rank: number; reason: string }>;
  versionReviews: Array<{
    label: string;
    strengths: string[];
    problems: string[];
    keepParts: string[];
    avoidParts: string[];
  }>;
  versionClaims: DiagnosisClaim[];
  sentenceDiagnosis: SentenceDiagnosis[];
  summary: string;
};

export type SynthesizerAgentOutput = {
  bestMergedAnswer: string;
  safeAnswer: SafeAnswerOutput;
  summary: string;
};

export type VerifierAgentOutput = {
  verification: AnswerVerification;
  summary: string;
};

export type TrainingAgentOutput = {
  rescueTemplate?: string;
  transferableFormula?: string;
  nextPracticeAdvice?: ReportBullet[];
  nextInterviewChecklist?: string[];
  replayCard: ReplayCard;
  summary: string;
};
