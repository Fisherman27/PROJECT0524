import {
  AnswerVerification,
  AnswerVerificationIssue,
  DiagnosisClaim,
  EvidenceCard,
  EvidenceReference,
  MissingInfoItem,
  ProfessorPressureTest,
  SafeAnswerOutput,
} from "@/types/replay";
import { ensureArray, ensureString } from "./json";

export const EMPTY_SAFE_ANSWER: SafeAnswerOutput = {
  answer30s: "",
  answer60s: "",
  usedEvidence: [],
  riskControls: [],
};

export const EMPTY_VERIFICATION: AnswerVerification = {
  passed: true,
  summary: "未发现明显安全风险。",
  issues: [],
};

export function normalizeMissingInfo(raw: unknown): MissingInfoItem[] {
  return ensureArray<Record<string, unknown>>(raw).map((item) => ({
    field: ensureString(item.field, "未说明信息"),
    reason: ensureString(item.reason),
    howToSupplement: ensureString(item.howToSupplement),
  }));
}

export function normalizeEvidenceRefs(raw: unknown, evidenceCards: EvidenceCard[]): EvidenceReference[] {
  return ensureArray<Record<string, unknown>>(raw)
    .map((ref): EvidenceReference | null => {
      const rawId = ensureString(ref.evidenceCardId);
      const rawTitle = ensureString(ref.evidenceCardTitle);
      const card = evidenceCards.find((c) => c.id === rawId)
        || evidenceCards.find((c) => rawTitle && c.title === rawTitle)
        || evidenceCards.find((c) => rawTitle && c.title.includes(rawTitle));

      if (!card) return null;
      const normalized: EvidenceReference = {
        evidenceCardId: card.id,
        evidenceCardTitle: card.title,
        reason: ensureString(ref.reason),
      };
      const quote = ensureString(ref.quote);
      if (quote) normalized.quote = quote;
      return normalized;
    })
    .filter((ref): ref is EvidenceReference => Boolean(ref));
}

export function normalizeDiagnosisClaims(raw: unknown, evidenceCards: EvidenceCard[]): DiagnosisClaim[] {
  return ensureArray<Record<string, unknown>>(raw).map((claim) => {
    const confidence = ["high", "medium", "low"].includes(claim.confidence as string)
      ? claim.confidence as DiagnosisClaim["confidence"]
      : "medium";
    return {
      title: ensureString(claim.title, "诊断结论"),
      detail: ensureString(claim.detail),
      evidenceRefs: normalizeEvidenceRefs(claim.evidenceRefs, evidenceCards),
      missingInfo: normalizeMissingInfo(claim.missingInfo),
      confidence,
    };
  });
}

export function normalizePressureTests(raw: unknown, evidenceCards: EvidenceCard[]): ProfessorPressureTest[] {
  return ensureArray<Record<string, unknown>>(raw).slice(0, 4).map((test) => {
    const currentSupportLevel = ["strong", "medium", "weak"].includes(test.currentSupportLevel as string)
      ? test.currentSupportLevel as ProfessorPressureTest["currentSupportLevel"]
      : "medium";
    return {
      riskyExpression: ensureString(test.riskyExpression),
      likelyQuestion: ensureString(test.likelyQuestion),
      dangerReason: ensureString(test.dangerReason),
      currentSupportLevel,
      safeResponse: ensureString(test.safeResponse),
      missingInfo: normalizeMissingInfo(test.missingInfo),
      evidenceRefs: normalizeEvidenceRefs(test.evidenceRefs, evidenceCards),
    };
  });
}

export function normalizeSafeAnswer(raw: unknown, evidenceCards: EvidenceCard[], fallbackAnswer = ""): SafeAnswerOutput {
  const obj = (raw || {}) as Record<string, unknown>;
  const answer60s = ensureString(obj.answer60s, fallbackAnswer);
  return {
    answer30s: ensureString(obj.answer30s, answer60s),
    answer60s,
    naturalVersion: ensureString(obj.naturalVersion) || undefined,
    researchVersion: ensureString(obj.researchVersion) || undefined,
    usedEvidence: normalizeEvidenceRefs(obj.usedEvidence, evidenceCards),
    riskControls: ensureArray<string>(obj.riskControls),
  };
}

function normalizeVerificationIssue(raw: Record<string, unknown>, evidenceCards: EvidenceCard[]): AnswerVerificationIssue {
  const allowedTypes: AnswerVerificationIssue["issueType"][] = [
    "unsupported_claim",
    "overclaim",
    "unclear_contribution",
    "unanswerable_term",
    "off_topic",
    "not_oral_friendly",
    "new_followup_risk",
  ];
  const issueType = allowedTypes.includes(raw.issueType as AnswerVerificationIssue["issueType"])
    ? raw.issueType as AnswerVerificationIssue["issueType"]
    : "unsupported_claim";
  const severity = ["high", "medium", "low"].includes(raw.severity as string)
    ? raw.severity as AnswerVerificationIssue["severity"]
    : "medium";

  return {
    issueType,
    originalText: ensureString(raw.originalText),
    reason: ensureString(raw.reason),
    suggestedFix: ensureString(raw.suggestedFix),
    severity,
    evidenceRefs: normalizeEvidenceRefs(raw.evidenceRefs, evidenceCards),
  };
}

export function normalizeVerification(raw: unknown, evidenceCards: EvidenceCard[]): AnswerVerification {
  const obj = (raw || {}) as Record<string, unknown>;
  const issues = ensureArray<Record<string, unknown>>(obj.issues).map((issue) =>
    normalizeVerificationIssue(issue, evidenceCards),
  );
  return {
    passed: typeof obj.passed === "boolean" ? obj.passed : issues.length === 0,
    summary: ensureString(obj.summary, issues.length === 0 ? "最终回答通过安全校验。" : "最终回答需要安全修正。"),
    issues,
    revisedAnswer: ensureString(obj.revisedAnswer) || undefined,
  };
}
