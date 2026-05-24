// Backend API integration tests
// Run: node tests/test-api.mjs
// Requires: npm run dev running on port 3000

const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  PASS: ${name}`, detail ? `(${detail})` : "");
    passed++;
  } else {
    console.log(`  FAIL: ${name}`, detail ? `(${detail})` : "");
    failed++;
  }
}

async function post(path, body) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: { message: e.message } } };
  }
}

async function main() {
  console.log("\n=== Interview Replay API Integration Tests ===\n");
  console.log(`Target: ${BASE}\n`);

  // ---- Test /api/questions ----
  console.log("--- /api/questions ---");
  const qRes = await post("/api/questions", {
    interviewType: "夏令营",
    targetDirection: "人工智能",
    backgroundMaterials: "我做过基于大模型的论文中译英TeX编辑器项目",
  });
  check("returns 200 OK", qRes.ok);
  check("has question field", !!qRes.data.question);
  check("has reason field", !!qRes.data.reason);
  if (!qRes.ok) console.log("    Error:", JSON.stringify(qRes.data).slice(0, 100));

  // ---- Test /api/replay/pre ----
  console.log("\n--- /api/replay/pre ---");
  const preRes = await post("/api/replay/pre", {
    interviewType: "夏令营",
    targetDirection: "人工智能 / NLP",
    backgroundMaterials: "我做过一个基于大模型的论文中译英TeX编辑器，负责Prompt设计和前后端开发",
    question: "你为什么想继续做大模型与科研写作相关方向？",
    liveAnswer: "我对人工智能比较感兴趣，也觉得大模型现在发展很快。",
    calmAnswer: "我之前做过大模型辅助论文中译英TeX编辑器，在项目中发现大模型虽然生成能力强，但在科研写作场景中容易出现术语不一致、格式破坏和上下文不稳定的问题。因此我希望之后继续研究大模型在科研辅助场景中的可靠性和可控性。",
  });
  check("returns 200 OK", preRes.ok);
  check("mode is pre", preRes.data.mode === "pre");
  check("has report", !!preRes.data.report);
  check("has questionIntent", !!preRes.data.report?.questionIntent);
  check("has liveAnswerDiagnosis array", Array.isArray(preRes.data.report?.liveAnswerDiagnosis));
  check("has calmAnswerImprovements array", Array.isArray(preRes.data.report?.calmAnswerImprovements));
  check("has liveLossAnalysis array", Array.isArray(preRes.data.report?.liveLossAnalysis));
  check("has evidenceCards array", Array.isArray(preRes.data.report?.evidenceCards));
  check("has materialRecall object", !!preRes.data.report?.materialRecall && typeof preRes.data.report.materialRecall === "object");
  check("has riskRadar array", Array.isArray(preRes.data.report?.riskRadar));
  check("has authenticityWarnings array", Array.isArray(preRes.data.report?.authenticityWarnings));
  check("has replayCard object", !!preRes.data.report?.replayCard && typeof preRes.data.report.replayCard === "object");
  check("has agentTrace >= 5", Array.isArray(preRes.data.report?.agentTrace) && preRes.data.report.agentTrace.length >= 5);
  check("has bestMergedAnswer", !!preRes.data.report?.bestMergedAnswer);
  check("has rescueTemplate", !!preRes.data.report?.rescueTemplate);
  check("has copyText", !!preRes.data.copyText);
  if (!preRes.ok) console.log("    Error:", JSON.stringify(preRes.data).slice(0, 200));

  // ---- Test /api/replay/pre validation ----
  console.log("\n--- /api/replay/pre (validation) ---");
  const preBad = await post("/api/replay/pre", { interviewType: "" });
  check("returns 400 on empty fields", preBad.status === 400);
  check("error code VALIDATION_ERROR", preBad.data?.error?.code === "VALIDATION_ERROR");

  // ---- Test /api/replay/post ----
  console.log("\n--- /api/replay/post ---");
  const postRes = await post("/api/replay/post", {
    question: "你为什么选择我们实验室？",
    interviewContext: "夏令营导师组面试",
    targetDirection: "人机协作",
    backgroundMaterials: "我做过大模型辅助论文翻译工具",
    answers: [
      { label: "A", source: "真实回答", content: "我对人工智能很感兴趣，也觉得老师的方向很有前景。" },
      { label: "B", source: "事后想到", content: "我之前做过大模型辅助论文翻译工具，所以对NLP和大模型应用比较感兴趣。" },
      { label: "C", source: "同学建议", content: "我关注到老师团队在人机协作和智能体方向有持续研究。我之前做论文翻译工具时发现大模型在真实科研写作中存在术语一致性和可控性问题。" },
    ],
  });
  check("returns 200 OK", postRes.ok);
  check("mode is post", postRes.data.mode === "post");
  check("has report", !!postRes.data.report);
  check("has questionIntent", !!postRes.data.report?.questionIntent);
  check("has answerRanking array", Array.isArray(postRes.data.report?.answerRanking));
  check("has versionReviews array", Array.isArray(postRes.data.report?.versionReviews));
  check("has sentenceDiagnosis array", Array.isArray(postRes.data.report?.sentenceDiagnosis));
  check("has evidenceCards array", Array.isArray(postRes.data.report?.evidenceCards));
  check("has materialRecall object", !!postRes.data.report?.materialRecall && typeof postRes.data.report.materialRecall === "object");
  check("has riskRadar array", Array.isArray(postRes.data.report?.riskRadar));
  check("has authenticityWarnings array", Array.isArray(postRes.data.report?.authenticityWarnings));
  check("has replayCard object", !!postRes.data.report?.replayCard && typeof postRes.data.report.replayCard === "object");
  check("has agentTrace >= 5", Array.isArray(postRes.data.report?.agentTrace) && postRes.data.report.agentTrace.length >= 5);
  check("has bestMergedAnswer", !!postRes.data.report?.bestMergedAnswer);
  check("has transferableFormula", !!postRes.data.report?.transferableFormula);
  check("has copyText", !!postRes.data.copyText);
  if (!postRes.ok) console.log("    Error:", JSON.stringify(postRes.data).slice(0, 200));

  // ---- Test /api/replay/post validation ----
  console.log("\n--- /api/replay/post (validation) ---");
  const postBad = await post("/api/replay/post", {
    question: "x", interviewContext: "y", targetDirection: "z",
    answers: [{ label: "A", source: "a", content: "only one answer" }],
  });
  check("returns 400 on <2 answers", postBad.status === 400);

  // ---- Results ----
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);

  // ---- P1: Material pre-analysis API ----
  console.log("--- /api/agents/material ---");
  const matRes = await post("/api/agents/material", {
    backgroundMaterials: "我做过一个基于大模型的论文中译英TeX编辑器，负责Prompt设计和前后端开发",
    targetDirection: "人工智能",
    targetSchool: "某大学",
  });
  check("/api/agents/material returns 200", matRes.ok);
  check("has evidenceCards array", Array.isArray(matRes.data?.evidenceCards));
  check("has summary", !!matRes.data?.summary);
  check("has inputFingerprint", !!matRes.data?.inputFingerprint);
  check("has agentTrace", Array.isArray(matRes.data?.agentTrace) && matRes.data.agentTrace.length >= 1);
  if (!matRes.ok) console.log("    Error:", JSON.stringify(matRes.data).slice(0, 200));

  // ---- P1: Question plan API ----
  console.log("\n--- /api/agents/question-plan ---");
  if (matRes.ok && matRes.data?.evidenceCards?.length > 0) {
    const qpRes = await post("/api/agents/question-plan", {
      question: "你为什么想继续做大模型与科研写作相关方向？",
      interviewType: "夏令营",
      targetDirection: "人工智能",
      evidenceCards: matRes.data.evidenceCards,
      materialFingerprint: matRes.data.inputFingerprint,
    });
    check("/api/agents/question-plan returns 200", qpRes.ok);
    check("has questionIntent", !!qpRes.data?.questionIntent);
    check("has evaluationFocus", Array.isArray(qpRes.data?.evaluationFocus));
    check("has expectedEvidence", Array.isArray(qpRes.data?.expectedEvidence));
    check("has inputFingerprint", !!qpRes.data?.inputFingerprint);
    check("has agentTrace", Array.isArray(qpRes.data?.agentTrace) && qpRes.data.agentTrace.length >= 1);
    if (!qpRes.ok) console.log("    Error:", JSON.stringify(qpRes.data).slice(0, 200));
  } else {
    console.log("  SKIP: material pre-analysis failed, skipping question-plan test");
  }

  // ---- P1: Replay with pre-analysis ----
  console.log("\n--- /api/replay/pre (with pre-analysis) ---");
  if (matRes.ok && matRes.data?.evidenceCards?.length > 0) {
    const preWithPlan = await post("/api/replay/pre", {
      interviewType: "夏令营",
      targetDirection: "人工智能 / NLP",
      backgroundMaterials: "我做过一个基于大模型的论文中译英TeX编辑器，负责Prompt设计和前后端开发",
      question: "你为什么想继续做大模型与科研写作相关方向？",
      liveAnswer: "我对人工智能比较感兴趣，也觉得大模型现在发展很快。",
      calmAnswer: "我之前做过大模型辅助论文中译英TeX编辑器，在项目中发现大模型虽然生成能力强，但在科研写作场景中容易出现术语不一致。",
      materialAnalysis: matRes.data,
    });
    check("pre with materialAnalysis returns 200", preWithPlan.ok);
    check("has usedCachedInput in trace", preWithPlan.ok &&
      Array.isArray(preWithPlan.data?.report?.agentTrace) &&
      preWithPlan.data.report.agentTrace.some((t) => t.usedCachedInput === true || t.summary?.includes("复用")));
    if (!preWithPlan.ok) console.log("    Error:", JSON.stringify(preWithPlan.data).slice(0, 200));
  } else {
    console.log("  SKIP: material pre-analysis failed, skipping replay with pre-analysis test");
  }

  // ---- Final Results ----
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed > 0) process.exit(1);
}

main();
