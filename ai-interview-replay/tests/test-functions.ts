// Pure logic tests - no server needed
// Run with: npx tsx tests/test-functions.ts

import { validatePreRequest, validatePostRequest, validateQuestionsRequest } from "../src/lib/schemas.ts";
import { normalizePreReport, normalizePostReport, sanitizeJsonBlock } from "../src/lib/ai/report-normalizer.ts";
import { formatPreCopyText, formatPostCopyText } from "../src/lib/copy-format.ts";
import { buildPrePrompt, buildPostPrompt, buildQuestionsPrompt } from "../src/lib/ai/prompts.ts";
import { makeMaterialFingerprint, makeQuestionFingerprint, createInputFingerprint } from "../src/lib/agents/fingerprint.ts";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean) {
  if (condition) {
    console.log(`  PASS: ${name}`);
    passed++;
  } else {
    console.log(`  FAIL: ${name}`);
    failed++;
  }
}

export async function testAll() {
  console.log("\n=== Unit Tests: Schema Validation ===\n");

  // Pre validate
  const preValid = validatePreRequest({
    interviewType: "夏令营", targetDirection: "AI",
    backgroundMaterials: "test", question: "q?", liveAnswer: "a", calmAnswer: "b",
  });
  check("validatePreRequest accepts valid", !!preValid);

  try { validatePreRequest({ interviewType: "" } as any); check("validatePreRequest rejects empty", false); }
  catch { check("validatePreRequest rejects empty", true); }

  // Post validate
  const postValid = validatePostRequest({
    question: "q?", interviewContext: "ctx", targetDirection: "dir",
    answers: [
      { label: "A", source: "s1", content: "c1" },
      { label: "B", source: "s2", content: "c2" },
    ],
  });
  check("validatePostRequest accepts valid", !!postValid && postValid.answers.length === 2);

  try {
    validatePostRequest({ question: "q", interviewContext: "c", targetDirection: "d", answers: [{ label: "A", source: "s", content: "only" }] });
    check("validatePostRequest rejects <2 answers", false);
  } catch { check("validatePostRequest rejects <2 answers", true); }

  // Questions validate
  const qValid = validateQuestionsRequest({ backgroundMaterials: "test" });
  check("validateQuestionsRequest accepts valid", !!qValid);

  console.log("\n=== Unit Tests: Report Normalization ===\n");

  const preJson = JSON.stringify({
    questionIntent: "考察科研动机",
    liveAnswerDiagnosis: [{ title: "空泛", detail: "无具体证据" }],
    calmAnswerImprovements: [{ title: "有证据", detail: "加入了项目经历" }],
    liveLossAnalysis: [{ title: "证据损失", detail: "遗漏了项目" }],
    missingEvidence: [{ title: "项目经历", detail: "应提到翻译工具" }],
    followUpRisks: [{ risk: "追问项目细节", reason: "提到了项目", suggestedPreparation: "准备细节" }],
    bestMergedAnswer: "融合后的最佳回答文本",
    rescueTemplate: "下次可以这样说：我的兴趣来自___",
    nextPracticeAdvice: [{ title: "证据训练", detail: "练习用经历支撑观点" }],
  });

  const preReport = normalizePreReport(preJson);
  check("normalizePreReport parses valid JSON", preReport.questionIntent === "考察科研动机");
  check("diagnosis count correct", preReport.liveAnswerDiagnosis.length === 1);
  check("risks count correct", preReport.followUpRisks.length === 1);
  check("bestMergedAnswer present", !!preReport.bestMergedAnswer);
  check("rescueTemplate present", !!preReport.rescueTemplate);

  try { normalizePreReport("bad json!!!"); check("normalizePreReport rejects invalid", false); }
  catch { check("normalizePreReport rejects invalid JSON", true); }

  const postJson = JSON.stringify({
    questionIntent: "考察匹配度",
    answerRanking: [{ label: "B", rank: 1, reason: "有证据" }, { label: "A", rank: 2, reason: "空泛" }],
    versionReviews: [{ label: "A", strengths: ["真实"], problems: ["空泛"], keepParts: [], avoidParts: [] }],
    sentenceDiagnosis: [{ original: "感兴趣", diagnosis: "空泛", suggestion: "加经历" }],
    vagueAndOverpackagingRisks: [{ risk: "x", reason: "y", suggestedPreparation: "z" }],
    followUpRisks: [{ risk: "x", reason: "y", suggestedPreparation: "z" }],
    bestMergedAnswer: "融合回答",
    transferableFormula: "1.经历→2.问题→3.方向",
    nextInterviewChecklist: ["准备1", "准备2"],
  });
  const postReport = normalizePostReport(postJson);
  check("normalizePostReport parses valid JSON", postReport.questionIntent === "考察匹配度");
  check("ranking count correct", postReport.answerRanking.length === 2);
  check("versionReviews count correct", postReport.versionReviews.length === 1);
  check("bestMergedAnswer present", !!postReport.bestMergedAnswer);
  check("transferableFormula present", !!postReport.transferableFormula);
  check("checklist has 2 items", postReport.nextInterviewChecklist.length === 2);

  console.log("\n=== Unit Tests: JSON Sanitizer ===\n");

  const mdBlock = '```json\n{"key":"val"}\n```';
  const clean = sanitizeJsonBlock(mdBlock);
  check("strips ```json markers", clean === '{"key":"val"}');

  const plain = '{"key":"val"}';
  check("plain JSON unchanged", sanitizeJsonBlock(plain) === plain);

  console.log("\n=== Unit Tests: Copy Format ===\n");

  const copyText = formatPreCopyText(preReport);
  check("formatPreCopyText produces text", copyText.length > 100);
  check("contains module titles", copyText.includes("问题真实意图") && copyText.includes("最佳融合回答"));

  const postCopy = formatPostCopyText(postReport);
  check("formatPostCopyText produces text", postCopy.length > 100);
  check("contains module titles", postCopy.includes("回答综合排名") && postCopy.includes("可迁移回答公式"));

  console.log("\n=== Unit Tests: Prompt Builders ===\n");

  const prePrompt = buildPrePrompt({
    interviewType: "夏令营", targetDirection: "NLP",
    backgroundMaterials: "材料", question: "问题？", liveAnswer: "临场", calmAnswer: "冷静",
  });
  check("buildPrePrompt includes question", prePrompt.includes("问题？"));
  check("buildPrePrompt includes live answer", prePrompt.includes("临场"));

  const postPrompt = buildPostPrompt({
    question: "问题？", interviewContext: "夏令营", targetDirection: "NLP",
    answers: [{ label: "A", source: "真实", content: "答案A" }],
  });
  check("buildPostPrompt includes answers", postPrompt.includes("答案A"));

  const qPrompt = buildQuestionsPrompt({ backgroundMaterials: "材料", interviewType: "夏令营" });
  check("buildQuestionsPrompt includes materials", qPrompt.includes("材料"));

  console.log("\n=== Unit Tests: P1 Fingerprint ===\n");

  const fp1 = createInputFingerprint({ a: 1, b: "hello" });
  const fp2 = createInputFingerprint({ a: 1, b: "hello" });
  check("fingerprint is deterministic", fp1 === fp2);

  const fp3 = createInputFingerprint({ a: 1, b: "world" });
  check("fingerprint changes with different input", fp1 !== fp3);

  const mFp = makeMaterialFingerprint("材料A", "AI", "清华");
  const mFp2 = makeMaterialFingerprint("材料A", "AI", "清华");
  check("material fingerprint deterministic", mFp === mFp2);

  const mFp3 = makeMaterialFingerprint("材料B", "AI", "清华");
  check("material fingerprint changes", mFp !== mFp3);

  const qFp = makeQuestionFingerprint("问题1", mFp, "AI");
  const qFp2 = makeQuestionFingerprint("问题1", mFp, "AI");
  check("question fingerprint deterministic", qFp === qFp2);

  const qFp3 = makeQuestionFingerprint("问题2", mFp, "AI");
  check("question fingerprint changes with question", qFp !== qFp3);

  console.log("\n=== Unit Tests: Pre-analysis schema pass-through ===\n");

  const preWithAnalysis = validatePreRequest({
    interviewType: "夏令营", targetDirection: "AI",
    backgroundMaterials: "test", question: "q?", liveAnswer: "a", calmAnswer: "b",
    materialAnalysis: {
      evidenceCards: [{ title: "test", type: "project", content: "c", supportedQuestions: [], abilities: [], possibleFollowUps: [], usageRisk: "", suggestedExpression: "" }],
      summary: "s", inputFingerprint: "fp", agentTrace: [],
    },
    questionPlan: {
      questionIntent: "intent", evaluationFocus: [], idealAnswerLayers: [], commonPitfalls: [],
      expectedEvidence: [], summary: "s", inputFingerprint: "fp2", agentTrace: [],
    },
  });
  check("pre request passes materialAnalysis", !!preWithAnalysis.materialAnalysis);
  check("pre request passes questionPlan", !!preWithAnalysis.questionPlan);

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  return { passed, failed };
}

// Run if called directly
testAll();
