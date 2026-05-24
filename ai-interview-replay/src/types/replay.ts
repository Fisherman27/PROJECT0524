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

export type PreReplayReport = {
  questionIntent: string;
  liveAnswerDiagnosis: ReportBullet[];
  calmAnswerImprovements: ReportBullet[];
  liveLossAnalysis: ReportBullet[];
  missingEvidence: ReportBullet[];
  followUpRisks: RiskItem[];
  bestMergedAnswer: string;
  rescueTemplate: string;
  nextPracticeAdvice: ReportBullet[];
};

export type PostReplayReport = {
  questionIntent: string;
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
  sentenceDiagnosis: SentenceDiagnosis[];
  vagueAndOverpackagingRisks: RiskItem[];
  followUpRisks: RiskItem[];
  bestMergedAnswer: string;
  transferableFormula: string;
  nextInterviewChecklist: string[];
};

export type PreReplayRequest = {
  interviewType: string;
  targetDirection: string;
  targetSchool?: string;
  backgroundMaterials: string;
  question: string;
  liveAnswer: string;
  calmAnswer: string;
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
