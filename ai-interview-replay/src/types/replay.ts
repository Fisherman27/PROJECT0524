export type ReportBullet = {
  title: string;
  detail: string;
};

export type RiskItem = {
  risk: string;
  reason: string;
  suggestedPreparation: string;
};

export type SentenceDiagnosis = {
  original: string;
  diagnosis: string;
  suggestion: string;
};

// ---- Multi-Agent upgrade types ----

export type EvidenceCard = {
  id: string;
  title: string;
  type: "project" | "research" | "course" | "competition" | "statement" | "other";
  content: string;
  supportedQuestions: string[];
  abilities: string[];
  possibleFollowUps: string[];
  usageRisk: string;
  suggestedExpression: string;
  missingInfo?: string[];
};

export type EvidenceReference = {
  evidenceCardId: string;
  evidenceCardTitle: string;
  quote?: string;
  reason: string;
};

export type MissingInfoItem = {
  field: string;
  reason: string;
  howToSupplement: string;
};

export type DiagnosisClaim = {
  title: string;
  detail: string;
  evidenceRefs: EvidenceReference[];
  missingInfo: MissingInfoItem[];
  confidence: "high" | "medium" | "low";
};

export type ProfessorPressureTest = {
  riskyExpression: string;
  likelyQuestion: string;
  dangerReason: string;
  currentSupportLevel: "strong" | "medium" | "weak";
  safeResponse: string;
  missingInfo: MissingInfoItem[];
  evidenceRefs: EvidenceReference[];
};

export type SafeAnswerOutput = {
  answer30s: string;
  answer60s: string;
  naturalVersion?: string;
  researchVersion?: string;
  usedEvidence: EvidenceReference[];
  riskControls: string[];
};

export type AnswerVerificationIssue = {
  issueType:
    | "unsupported_claim"
    | "overclaim"
    | "unclear_contribution"
    | "unanswerable_term"
    | "off_topic"
    | "not_oral_friendly"
    | "new_followup_risk";
  originalText: string;
  reason: string;
  suggestedFix: string;
  severity: "high" | "medium" | "low";
  evidenceRefs: EvidenceReference[];
};

export type AnswerVerification = {
  passed: boolean;
  summary: string;
  issues: AnswerVerificationIssue[];
  revisedAnswer?: string;
};

export type AnswerMaturityLevel = "L1" | "L2" | "L3" | "L4" | "L5";

export type AnswerMaturity = {
  level: AnswerMaturityLevel;
  label: string;
  reason: string;
  nextUpgrade: string;
};

export type QualitySummary = {
  oneSentenceDiagnosis: string;
  topRisk: string;
  topMissingInfo: MissingInfoItem[];
  evidenceRecallText: string;
  answerSafety: "passed" | "needs_fix" | "not_checked";
  maturity?: AnswerMaturity;
  conflictNotes: string[];
};

export type MaterialRecall = {
  expectedCount: number;
  usedCount: number;
  usedEvidence: string[];
  missingEvidence: string[];
  recallSummary: string;
  improvementHint: string;
};

export type RiskLevel = "低" | "中" | "高";

export type RiskRadarItem = {
  dimension:
    | "空泛表达风险"
    | "证据不足风险"
    | "贡献不清风险"
    | "过度包装风险"
    | "导师匹配不足风险"
    | "追问承接不足风险";
  level: RiskLevel;
  reason: string;
  action: string;
};

export type AuthenticityWarning = {
  expression: string;
  riskType: string;
  reason: string;
  saferAlternative: string;
};

export type ReplayCard = {
  biggestProblem: string;
  keyImprovement: string;
  nextFormula: string;
  rescueSentence: string;
  nextQuestion: string;
};

export type AgentTraceItem = {
  agentName: string;
  agentVersion?: string;
  stage?: "material" | "question" | "diagnosis" | "synthesis" | "training" | "compose";
  summary: string;
  status: "success" | "failed" | "skipped";
  durationMs?: number;
  usedCachedInput?: boolean;
  errorCode?: string;
};

// ---- Extended Report types ----

export type PreReplayReport = {
  questionIntent: string;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
  liveAnswerDiagnosis: ReportBullet[];
  calmAnswerImprovements: ReportBullet[];
  liveLossAnalysis: ReportBullet[];
  missingEvidence: ReportBullet[];
  gapClaims: DiagnosisClaim[];
  evidenceClaims: DiagnosisClaim[];
  riskRadar: RiskRadarItem[];
  authenticityWarnings: AuthenticityWarning[];
  followUpRisks: RiskItem[];
  pressureTests: ProfessorPressureTest[];
  bestMergedAnswer: string;
  safeAnswer: SafeAnswerOutput;
  answerVerification: AnswerVerification;
  qualitySummary: QualitySummary;
  answerMaturity?: AnswerMaturity;
  rescueTemplate: string;
  nextPracticeAdvice: ReportBullet[];
  replayCard: ReplayCard;
  agentTrace: AgentTraceItem[];
};

export type PostReplayReport = {
  questionIntent: string;
  evidenceCards: EvidenceCard[];
  materialRecall: MaterialRecall;
  evidenceClaims: DiagnosisClaim[];
  answerRanking: Array<{
    label: string;
    rank: number;
    reason: string;
  }>;
  versionReviews: Array<{
    label: string;
    strengths: string[];
    problems: string[];
    keepParts: string[];
    avoidParts: string[];
  }>;
  versionClaims: DiagnosisClaim[];
  sentenceDiagnosis: SentenceDiagnosis[];
  vagueAndOverpackagingRisks: RiskItem[];
  riskRadar: RiskRadarItem[];
  authenticityWarnings: AuthenticityWarning[];
  followUpRisks: RiskItem[];
  pressureTests: ProfessorPressureTest[];
  bestMergedAnswer: string;
  safeAnswer: SafeAnswerOutput;
  answerVerification: AnswerVerification;
  qualitySummary: QualitySummary;
  answerMaturity?: AnswerMaturity;
  transferableFormula: string;
  nextInterviewChecklist: string[];
  replayCard: ReplayCard;
  agentTrace: AgentTraceItem[];
};

// ---- Request types ----

// ---- P1 Pre-analysis types ----

export type ExpectedEvidenceItem = {
  title: string;
  evidenceCardId: string;
  evidenceCardTitle: string;
  reason: string;
  priority: "high" | "medium" | "low";
  suggestedUse: string;
  missingInfo?: MissingInfoItem[];
};

export type MaterialPreAnalysis = {
  evidenceCards: EvidenceCard[];
  summary: string;
  inputFingerprint: string;
  agentTrace: AgentTraceItem[];
};

export type QuestionPreAnalysis = {
  questionIntent: string;
  evaluationFocus: string[];
  idealAnswerLayers: string[];
  commonPitfalls: string[];
  expectedEvidence: ExpectedEvidenceItem[];
  summary: string;
  inputFingerprint: string;
  agentTrace: AgentTraceItem[];
};

export type PreReplayRequest = {
  interviewType: string;
  targetDirection: string;
  targetSchool?: string;
  backgroundMaterials: string;
  question: string;
  liveAnswer: string;
  calmAnswer: string;
  materialAnalysis?: MaterialPreAnalysis;
  questionPlan?: QuestionPreAnalysis;
};

export type PostReplayRequest = {
  question: string;
  interviewContext: string;
  targetDirection: string;
  backgroundMaterials?: string;
  answers: Array<{
    label: string;
    source: string;
    content: string;
  }>;
  materialAnalysis?: MaterialPreAnalysis;
  questionPlan?: QuestionPreAnalysis;
};

export type QuestionsRequest = {
  interviewType?: string;
  targetDirection?: string;
  backgroundMaterials: string;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export type PreReplayResponse = {
  mode: "pre";
  report: PreReplayReport;
  copyText: string;
};

export type PostReplayResponse = {
  mode: "post";
  report: PostReplayReport;
  copyText: string;
};

export type QuestionsResponse = {
  question: string;
  reason: string;
};

export type PreReplayStage =
  | "editing"
  | "ready"
  | "liveAnswering"
  | "liveLocked"
  | "abandoned"
  | "submitting"
  | "result";

export type AnswerLockReason = "timeout" | "manual";
