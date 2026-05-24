// Backend API test script - run with: node tests/test-backend.mjs
// Tests logic functions directly (no server needed for unit tests)
// For integration tests, start dev server first: npm run dev

import {
  validatePreRequest,
  validatePostRequest,
  validateQuestionsRequest,
} from "../src/lib/schemas.ts";

import {
  normalizePreReport,
  normalizePostReport,
  sanitizeJsonBlock,
} from "../src/lib/ai/report-normalizer.ts";

import {
  formatPreCopyText,
  formatPostCopyText,
} from "../src/lib/copy-format.ts";

import {
  buildPrePrompt,
  buildPostPrompt,
  buildQuestionsPrompt,
} from "../src/lib/ai/prompts.ts";

// ---------- Schema Validation Tests ----------

console.log("\n=== Schema Validation Tests ===\n");

// Test 1: valid pre request
try {
  const preReq = validatePreRequest({
    interviewType: "夏令营",
    targetDirection: "人工智能",
    backgroundMaterials: "做过大模型项目",
    question: "为什么选这个方向？",
    liveAnswer: "感兴趣",
    calmAnswer: "因为做过项目所以感兴趣",
  });
  console.log("PASS: validatePreRequest (valid) ->", Object.keys(preReq));
} catch (e) {
  console.log("FAIL: validatePreRequest (valid) ->", e.message);
}

// Test 2: invalid pre request (missing field)
try {
  validatePreRequest({ interviewType: "" });
  console.log("FAIL: validatePreRequest (missing fields) should throw");
} catch (e) {
  console.log("PASS: validatePreRequest (missing fields) correctly threw ->", e.message.slice(0, 50));
}

// Test 3: valid post request
try {
  const postReq = validatePostRequest({
    question: "为什么选我们实验室？",
    interviewContext: "夏令营面试",
    targetDirection: "NLP",
    backgroundMaterials: "论文翻译工具",
    answers: [
      { label: "A", source: "真实回答", content: "感兴趣" },
      { label: "B", source: "事后想到", content: "因为做过论文翻译工具" },
    ],
  });
  console.log("PASS: validatePostRequest (valid) -> answers count:", postReq.answers.length);
} catch (e) {
  console.log("FAIL: validatePostRequest (valid) ->", e.message);
}

// Test 4: invalid post request (<2 answers)
try {
  validatePostRequest({
    question: "why",
    interviewContext: "x",
    targetDirection: "y",
    answers: [{ label: "A", source: "a", content: "only one" }],
  });
  console.log("FAIL: validatePostRequest (<2 answers) should throw");
} catch (e) {
  console.log("PASS: validatePostRequest (<2 answers) correctly threw ->", e.message.slice(0, 50));
}

// Test 5: valid questions request
try {
  const qReq = validateQuestionsRequest({
    backgroundMaterials: "大模型项目",
    interviewType: "夏令营",
    targetDirection: "NLP",
  });
  console.log("PASS: validateQuestionsRequest (valid)");
} catch (e) {
  console.log("FAIL: validateQuestionsRequest (valid) ->", e.message);
}

// ---------- Report Normalization Tests ----------

console.log("\n=== Report Normalization Tests ===\n");

const validPreJson = JSON.stringify({
  questionIntent: "考察科研兴趣",
  liveAnswerDiagnosis: [{ title: "空泛", detail: "只说感兴趣" }],
  calmAnswerImprovements: [{ title: "补充证据", detail: "加入了项目经历" }],
  liveLossAnalysis: [{ title: "证据损失", detail: "未使用项目经历" }],
  missingEvidence: [{ title: "项目经历", detail: "论文翻译工具" }],
  followUpRisks: [{ risk: "具体做了什么", reason: "提到项目但没说细节", suggestedPreparation: "准备细节" }],
  bestMergedAnswer: "融合回答内容",
  rescueTemplate: "下次可以这样说：___",
  nextPracticeAdvice: [{ title: "练习方向", detail: "多练习证据连接" }],
});

// Test 6: normalize valid pre report
try {
  const report = normalizePreReport(validPreJson);
  console.log("PASS: normalizePreReport (valid) -> questionIntent:", report.questionIntent);
  console.log("  - diagnosis count:", report.liveAnswerDiagnosis.length);
  console.log("  - risks count:", report.followUpRisks.length);
} catch (e) {
  console.log("FAIL: normalizePreReport (valid) ->", e.message);
}

// Test 7: normalize invalid json
try {
  normalizePreReport("not json at all");
  console.log("FAIL: normalizePreReport (invalid) should throw");
} catch (e) {
  console.log("PASS: normalizePreReport (invalid) correctly threw ->", e.message);
}

// Test 8: normalize partial json (missing fields)
try {
  const partial = normalizePreReport(JSON.stringify({ questionIntent: "only one field" }));
  console.log("PASS: normalizePreReport (partial) -> filled defaults, diagnosis:", partial.liveAnswerDiagnosis.length);
} catch (e) {
  console.log("FAIL: normalizePreReport (partial) ->", e.message);
}

// ---------- JSON Sanitizer Tests ----------

console.log("\n=== JSON Sanitizer Tests ===\n");

// Test 9: strip markdown code blocks
const mdJson = '```json\n{"key": "value"}\n```';
console.log("  Result:", sanitizeJsonBlock(mdJson).slice(0, 30));

// Test 10: plain json passes through
const plainJson = '{"key": "value"}';
console.log("  Result:", sanitizeJsonBlock(plainJson));

// ---------- Copy Format Tests ----------

console.log("\n=== Copy Format Tests ===\n");

const testPreReport = normalizePreReport(validPreJson);
const preCopy = formatPreCopyText(testPreReport);
console.log("PASS: formatPreCopyText length:", preCopy.length);
console.log("  First 100 chars:", preCopy.slice(0, 80));

const validPostJson = JSON.stringify({
  questionIntent: "考察匹配度",
  answerRanking: [{ label: "A", rank: 2, reason: "空泛" }, { label: "B", rank: 1, reason: "有证据" }],
  versionReviews: [{ label: "A", strengths: ["真实"], problems: ["空泛"], keepParts: ["口吻"], avoidParts: ["内容"] }],
  sentenceDiagnosis: [{ original: "感兴趣", diagnosis: "空泛", suggestion: "具体化" }],
  vagueAndOverpackagingRisks: [{ risk: "空泛", reason: "无证据", suggestedPreparation: "补充" }],
  followUpRisks: [{ risk: "追问", reason: "a", suggestedPreparation: "b" }],
  bestMergedAnswer: "融合回答",
  transferableFormula: "回答公式...",
  nextInterviewChecklist: ["准备事项1", "准备事项2"],
});
const testPostReport = normalizePostReport(validPostJson);
const postCopy = formatPostCopyText(testPostReport);
console.log("PASS: formatPostCopyText length:", postCopy.length);

// ---------- Prompt Builder Tests ----------

console.log("\n=== Prompt Builder Tests ===\n");

const prePrompt = buildPrePrompt({
  interviewType: "夏令营",
  targetDirection: "NLP",
  backgroundMaterials: "测试材料",
  question: "测试问题",
  liveAnswer: "临场回答",
  calmAnswer: "冷静回答",
});
console.log("PASS: buildPrePrompt length:", prePrompt.length);

const postPrompt = buildPostPrompt({
  question: "测试问题",
  interviewContext: "夏令营",
  targetDirection: "NLP",
  answers: [
    { label: "A", source: "真实", content: "回答内容A" },
    { label: "B", source: "事后", content: "回答内容B" },
  ],
});
console.log("PASS: buildPostPrompt length:", postPrompt.length);

const qPrompt = buildQuestionsPrompt({
  backgroundMaterials: "测试材料",
  interviewType: "夏令营",
});
console.log("PASS: buildQuestionsPrompt length:", qPrompt.length);

// ---------- Summary ----------

console.log("\n=== All tests completed ===\n");
