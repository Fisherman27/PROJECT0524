// Pure logic tests - no server needed
// Run with: npx tsx tests/test-functions.ts

import { validatePreRequest, validatePostRequest, validateQuestionsRequest } from "../src/lib/schemas.ts";
import { normalizePreReport, normalizePostReport, sanitizeJsonBlock } from "../src/lib/ai/report-normalizer.ts";
import { formatPreCopyText, formatPostCopyText } from "../src/lib/copy-format.ts";
import { formatPreMarkdown, formatPostMarkdown } from "../src/lib/markdown-export.ts";
import { buildPrePrompt, buildPostPrompt, buildQuestionsPrompt } from "../src/lib/ai/prompts.ts";
import { makeMaterialFingerprint, makeQuestionFingerprint, createInputFingerprint } from "../src/lib/agents/fingerprint.ts";
import { assessMaturity } from "../src/lib/agents/composer.ts";
import { readFileSync } from "fs";
import { join } from "path";

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
    evidenceClaims: [{ title: "回答缺少项目证据", detail: "临场回答没有调用项目经历", evidenceRefs: [], missingInfo: [], confidence: "high" }],
    pressureTests: [{ riskyExpression: "模型优化", likelyQuestion: "你优化的是参数还是Prompt？", dangerReason: "容易夸大贡献", currentSupportLevel: "medium", safeResponse: "我主要做Prompt和流程优化", missingInfo: [], evidenceRefs: [] }],
    bestMergedAnswer: "融合后的最佳回答文本",
    safeAnswer: { answer: "安全回答，控制在150字以内，适合口语表达", usedEvidence: [], riskControls: ["避免夸大"] },
    answerVerification: { passed: true, summary: "通过校验", issues: [] },
    rescueTemplate: "下次可以这样说：我的兴趣来自___",
    nextPracticeAdvice: [{ title: "证据训练", detail: "练习用经历支撑观点" }],
  });

  const preReport = normalizePreReport(preJson);
  check("normalizePreReport parses valid JSON", preReport.questionIntent === "考察科研动机");
  check("diagnosis count correct", preReport.liveAnswerDiagnosis.length === 1);
  check("risks count correct", preReport.followUpRisks.length === 1);
  check("bestMergedAnswer present", !!preReport.bestMergedAnswer);
  check("rescueTemplate present", !!preReport.rescueTemplate);
  check("pre evidenceClaims present", preReport.evidenceClaims.length === 1);
  check("pre pressureTests present", preReport.pressureTests.length === 1);
  check("pre safeAnswer present", !!preReport.safeAnswer.answer);
  check("pre verification present", typeof preReport.answerVerification.passed === "boolean");

  try { normalizePreReport("bad json!!!"); check("normalizePreReport rejects invalid", false); }
  catch { check("normalizePreReport rejects invalid JSON", true); }

  const postJson = JSON.stringify({
    questionIntent: "考察匹配度",
    answerRanking: [{ label: "B", rank: 1, reason: "有证据" }, { label: "A", rank: 2, reason: "空泛" }],
    versionReviews: [{ label: "A", strengths: ["真实"], problems: ["空泛"], keepParts: [], avoidParts: [] }],
    sentenceDiagnosis: [{ original: "感兴趣", diagnosis: "空泛", suggestion: "加经历" }],
    vagueAndOverpackagingRisks: [{ risk: "x", reason: "y", suggestedPreparation: "z" }],
    followUpRisks: [{ risk: "x", reason: "y", suggestedPreparation: "z" }],
    evidenceClaims: [{ title: "版本B证据更充分", detail: "版本B提到项目经历", evidenceRefs: [], missingInfo: [], confidence: "medium" }],
    pressureTests: [{ riskyExpression: "深入研究", likelyQuestion: "读过哪些论文？", dangerReason: "材料不足", currentSupportLevel: "weak", safeResponse: "初步接触相关问题", missingInfo: [], evidenceRefs: [] }],
    bestMergedAnswer: "融合回答",
    safeAnswer: { answer: "安全回答版本", usedEvidence: [], riskControls: ["降低包装"] },
    answerVerification: { passed: false, summary: "需要修改", issues: [] },
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
  check("post evidenceClaims present", postReport.evidenceClaims.length === 1);
  check("post pressureTests present", postReport.pressureTests.length === 1);
  check("post safeAnswer present", !!postReport.safeAnswer.answer);
  check("post verification present", typeof postReport.answerVerification.passed === "boolean");

  console.log("\n=== Unit Tests: JSON Sanitizer ===\n");

  const mdBlock = '```json\n{"key":"val"}\n```';
  const clean = sanitizeJsonBlock(mdBlock);
  check("strips ```json markers", clean === '{"key":"val"}');

  const plain = '{"key":"val"}';
  check("plain JSON unchanged", sanitizeJsonBlock(plain) === plain);

  console.log("\n=== Unit Tests: Copy Format ===\n");

  const copyText = formatPreCopyText(preReport);
  check("formatPreCopyText produces text", copyText.length > 100);
  check("contains module titles", copyText.includes("问题真实意图") && copyText.includes("安全融合回答"));
  check("pre copy contains quality sections", copyText.includes("导师压力测试") && copyText.includes("回答安全校验"));

  const postCopy = formatPostCopyText(postReport);
  check("formatPostCopyText produces text", postCopy.length > 100);
  check("contains module titles", postCopy.includes("回答综合排名") && postCopy.includes("可迁移回答公式"));
  check("post copy contains quality sections", postCopy.includes("证据依据") && postCopy.includes("安全融合回答"));

  const preMd = formatPreMarkdown(preReport);
  const postMd = formatPostMarkdown(postReport);
  check("pre markdown contains quality sections", preMd.includes("导师压力测试") && preMd.includes("回答安全校验"));
  check("post markdown contains quality sections", postMd.includes("证据依据") && postMd.includes("安全融合回答"));

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
      evidenceCards: [{ id: "card_1", title: "test", type: "project", content: "c", supportedQuestions: [], abilities: [], possibleFollowUps: [], usageRisk: "", suggestedExpression: "" }],
      summary: "s", inputFingerprint: "fp", agentTrace: [],
    },
    questionPlan: {
      questionIntent: "intent", evaluationFocus: [], idealAnswerLayers: [], commonPitfalls: [],
      expectedEvidence: [], summary: "s", inputFingerprint: "fp2", agentTrace: [],
    },
  });
  check("pre request passes materialAnalysis", !!preWithAnalysis.materialAnalysis);
  check("pre request passes questionPlan", !!preWithAnalysis.questionPlan);

  console.log("\n=== Unit Tests: P1 Quality Summary & Maturity ===\n");

  // Test assessMaturity: L1 template expression
  const matL1 = assessMaturity(
    { expectedCount: 3, usedCount: 0, usedEvidence: [], missingEvidence: [], recallSummary: "", improvementHint: "" },
    [],
    [],
    { passed: true, summary: "", issues: [] },
  );
  check("assessMaturity L1 template expression", matL1.level === "L1");

  // Test assessMaturity: L3 has evidence + problem awareness
  const matL3 = assessMaturity(
    { expectedCount: 3, usedCount: 2, usedEvidence: [], missingEvidence: [], recallSummary: "", improvementHint: "" },
    [{ title: "test", detail: "test", evidenceRefs: [], missingInfo: [], confidence: "high" }],
    [{ riskyExpression: "test", likelyQuestion: "test", dangerReason: "贡献夸大风险", currentSupportLevel: "medium", safeResponse: "test", missingInfo: [], evidenceRefs: [] }],
    { passed: true, summary: "", issues: [] },
  );
  check("assessMaturity L3 has experience + problem awareness (contribution unclear)", matL3.level === "L3");

  // Test assessMaturity: L5 all clear
  const matL5 = assessMaturity(
    { expectedCount: 3, usedCount: 3, usedEvidence: [], missingEvidence: [], recallSummary: "", improvementHint: "" },
    [{ title: "test", detail: "test", evidenceRefs: [], missingInfo: [], confidence: "high" }],
    [{ riskyExpression: "test", likelyQuestion: "test", dangerReason: "safe", currentSupportLevel: "strong", safeResponse: "test", missingInfo: [], evidenceRefs: [] }],
    { passed: true, summary: "", issues: [] },
  );
  check("assessMaturity L5 clear boundaries", matL5.level === "L5");

  // Test normalizer includes P1 fields
  const preJsonP1 = JSON.stringify({
    questionIntent: "考察科研动机",
    gapClaims: [{ title: "证据损失", detail: "临场未使用项目证据", evidenceRefs: [{ evidenceCardId: "card_1", evidenceCardTitle: "test", reason: "test" }], missingInfo: [], confidence: "high" }],
    evidenceClaims: [],
    qualitySummary: { oneSentenceDiagnosis: "一句话诊断", topRisk: "证据不足", topMissingInfo: [], evidenceRecallText: "0/3", answerSafety: "passed", conflictNotes: [] },
    answerMaturity: { level: "L1", label: "模板表达", reason: "空泛", nextUpgrade: "补充经历" },
  });
  const preP1 = normalizePreReport(preJsonP1);
  check("normalizer preserves gapClaims", preP1.gapClaims.length === 1);
  check("normalizer preserves qualitySummary", preP1.qualitySummary.oneSentenceDiagnosis === "一句话诊断");
  check("normalizer preserves answerMaturity", preP1.answerMaturity?.level === "L1");

  const postJsonP1 = JSON.stringify({
    versionClaims: [{ title: "版本B更安全", detail: "B版降低了过度包装", evidenceRefs: [], missingInfo: [], confidence: "medium" }],
    qualitySummary: { oneSentenceDiagnosis: "诊断2", topRisk: "贡献夸大", topMissingInfo: [], evidenceRecallText: "1/2", answerSafety: "needs_fix", conflictNotes: ["安全校验优先"] },
    answerMaturity: { level: "L3", label: "有问题意识", reason: "有项目", nextUpgrade: "连接导师方向" },
  });
  const postP1 = normalizePostReport(postJsonP1);
  check("normalizer preserves versionClaims", postP1.versionClaims.length === 1);
  check("normalizer preserves post qualitySummary", postP1.qualitySummary.answerSafety === "needs_fix");
  check("normalizer preserves post answerMaturity", postP1.answerMaturity?.level === "L3");

  // Test copy/markdown includes P1 sections
  check("pre copy contains quality summary", formatPreCopyText(preP1).includes("质量摘要"));
  check("pre copy contains gap diagnosis", formatPreCopyText(preP1).includes("临场差距诊断"));
  check("post copy contains quality summary", formatPostCopyText(postP1).includes("质量摘要"));
  check("post copy contains version diagnosis", formatPostCopyText(postP1).includes("版本差异诊断"));
  check("pre markdown contains quality summary", formatPreMarkdown(preP1).includes("质量摘要"));
  check("pre markdown contains gap diagnosis", formatPreMarkdown(preP1).includes("临场差距诊断"));
  check("post markdown contains quality summary", formatPostMarkdown(postP1).includes("质量摘要"));
  check("post markdown contains version diagnosis", formatPostMarkdown(postP1).includes("版本差异诊断"));

  // Test quality fixtures exist and valid JSON
  const fixtureNames = ["motivation", "project_intro", "contribution_boundary", "pressure_question", "future_plan"];
  for (const name of fixtureNames) {
    const raw = readFileSync(join(import.meta.dirname, "fixtures", "quality", `${name}.json`), "utf-8");
    const parsed = JSON.parse(raw);
    check(`fixture ${name} has name`, typeof parsed.name === "string");
    check(`fixture ${name} has backgroundMaterials`, typeof parsed.backgroundMaterials === "string");
    check(`fixture ${name} has question`, typeof parsed.question === "string");
    check(`fixture ${name} has liveAnswer`, typeof parsed.liveAnswer === "string");
    check(`fixture ${name} has calmAnswer`, typeof parsed.calmAnswer === "string");
    check(`fixture ${name} has expected`, typeof parsed.expected === "object");
    check(`fixture ${name} has mustDetectRisks`, Array.isArray(parsed.expected.mustDetectRisks));
    check(`fixture ${name} has forbiddenPhrasesInAnswer`, Array.isArray(parsed.expected.forbiddenPhrasesInAnswer));
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  return { passed, failed };
}

// Run if called directly
testAll();
