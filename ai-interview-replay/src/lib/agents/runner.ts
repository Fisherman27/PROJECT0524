import {
  PreReplayRequest, PostReplayRequest,
  PreReplayReport, PostReplayReport,
  AgentTraceItem,
  MaterialPreAnalysis, QuestionPreAnalysis,
  EvidenceCard, ExpectedEvidenceItem,
} from "@/types/replay";
import { runMaterialAgent } from "./material-agent";
import { runIntentAgent } from "./intent-agent";
import { runEvidencePlannerAgent } from "./evidence-planner-agent";
import { runEvidenceAgent } from "./evidence-agent";
import { runProfessorAgent } from "./professor-agent";
import { runGapAgent } from "./gap-agent";
import { runDiffAgent } from "./diff-agent";
import { runSynthesizerAgent } from "./synthesizer-agent";
import { runVerifierAgent } from "./verifier-agent";
import { runTrainingAgent } from "./training-agent";
import {
  composePreReport, composePostReport, buildQualitySummary, assessMaturity,
} from "./composer";
import { makeMaterialFingerprint, makeQuestionFingerprint } from "./fingerprint";
import { MaterialAgentOutput, IntentAgentOutput, ProfessorAgentOutput, GapAgentOutput, DiffAgentOutput, VerifierAgentOutput } from "./types";
import { EMPTY_VERIFICATION } from "./quality-normalizers";

function trace(agentName: string, summary: string, startMs: number, overrides?: Partial<AgentTraceItem>): AgentTraceItem {
  return {
    agentName,
    agentVersion: "v1",
    summary: summary.slice(0, 100),
    status: "success",
    durationMs: Date.now() - startMs,
    ...overrides,
  };
}

// ---- Pre-analysis resolver ----

async function resolveMaterialAnalysis(req: {
  backgroundMaterials: string;
  targetDirection?: string;
  targetSchool?: string;
  materialAnalysis?: MaterialPreAnalysis;
}): Promise<{ material: MaterialAgentOutput; cached: boolean }> {
  const currentFingerprint = makeMaterialFingerprint(
    req.backgroundMaterials,
    req.targetDirection,
    req.targetSchool,
  );

  if (
    req.materialAnalysis?.inputFingerprint === currentFingerprint &&
    req.materialAnalysis.evidenceCards?.length > 0
  ) {
    const ma = req.materialAnalysis;
    const validatedCards: EvidenceCard[] = ma.evidenceCards.map((c, index) => ({
      id: c.id || `card_${index + 1}`,
      title: c.title || "未命名",
      type: c.type || "other",
      content: c.content || "",
      supportedQuestions: Array.isArray(c.supportedQuestions) ? c.supportedQuestions : [],
      abilities: Array.isArray(c.abilities) ? c.abilities : [],
      possibleFollowUps: Array.isArray(c.possibleFollowUps) ? c.possibleFollowUps : [],
      usageRisk: typeof c.usageRisk === "string" ? c.usageRisk : "",
      suggestedExpression: typeof c.suggestedExpression === "string" ? c.suggestedExpression : "",
      missingInfo: Array.isArray(c.missingInfo) ? c.missingInfo : [],
    }));

    return {
      material: {
        evidenceCards: validatedCards,
        summary: ma.summary || "",
      },
      cached: true,
    };
  }

  const material = await runMaterialAgent({
    backgroundMaterials: req.backgroundMaterials,
    targetDirection: req.targetDirection,
    targetSchool: req.targetSchool,
  });
  return { material, cached: false };
}

async function resolveQuestionPlan(req: {
  question: string;
  interviewType?: string;
  targetDirection?: string;
  targetSchool?: string;
  backgroundMaterials: string;
  questionPlan?: QuestionPreAnalysis;
  materialFingerprint?: string;
  evidenceCards?: EvidenceCard[];
}, traces: AgentTraceItem[]): Promise<QuestionPreAnalysis> {
  const currentFingerprint = makeQuestionFingerprint(
    req.question,
    req.materialFingerprint || "",
    req.targetDirection,
  );

  if (
    req.questionPlan?.inputFingerprint === currentFingerprint &&
    req.questionPlan.questionIntent
  ) {
    const qp = req.questionPlan;
    traces.push({
      agentName: "问题意图分析器+证据规划器",
      agentVersion: "v1",
      stage: "question",
      summary: "复用预分析结果",
      status: "success",
      usedCachedInput: true,
    });

    return {
      questionIntent: qp.questionIntent,
      evaluationFocus: Array.isArray(qp.evaluationFocus) ? qp.evaluationFocus : [],
      idealAnswerLayers: Array.isArray(qp.idealAnswerLayers) ? qp.idealAnswerLayers : [],
      commonPitfalls: Array.isArray(qp.commonPitfalls) ? qp.commonPitfalls : [],
      expectedEvidence: Array.isArray(qp.expectedEvidence)
        ? qp.expectedEvidence.map((e) => ({
            title: e.title || "",
            evidenceCardId: e.evidenceCardId || "",
            evidenceCardTitle: e.evidenceCardTitle || "",
            reason: e.reason || "",
            priority: e.priority || "medium",
            suggestedUse: e.suggestedUse || "",
            missingInfo: Array.isArray(e.missingInfo) ? e.missingInfo : [],
          }))
        : [],
      summary: qp.summary || "",
      inputFingerprint: currentFingerprint,
      agentTrace: [],
    };
  }

  // Fallback: run intent
  const t0 = Date.now();
  let questionIntent = "";
  let evaluationFocus: string[] = [];
  let idealAnswerLayers: string[] = [];
  let commonPitfalls: string[] = [];

  try {
    const intent = await runIntentAgent({
      question: req.question,
      interviewType: req.interviewType,
      targetDirection: req.targetDirection,
      targetSchool: req.targetSchool,
    });
    questionIntent = intent.questionIntent;
    evaluationFocus = intent.evaluationFocus;
    idealAnswerLayers = intent.idealAnswerLayers;
    commonPitfalls = intent.commonPitfalls;
    traces.push(trace("问题意图分析器", intent.summary, t0, { stage: "question" }));
  } catch {
    traces.push({
      agentName: "问题意图分析器",
      agentVersion: "v1",
      stage: "question",
      summary: "分析失败",
      status: "failed",
      errorCode: "intent_failed",
    });
  }

  // Fallback: also run evidence planner when evidence cards are available
  let expectedEvidence: ExpectedEvidenceItem[] = [];
  if (questionIntent && (req.evidenceCards?.length ?? 0) > 0) {
    try {
      const planner = await runEvidencePlannerAgent({
        question: req.question,
        questionIntent,
        evidenceCards: req.evidenceCards!,
      });
      expectedEvidence = planner.expectedEvidence;
      traces.push(trace("证据规划器", planner.summary, Date.now(), { stage: "question" }));
    } catch {
      traces.push({
        agentName: "证据规划器",
        agentVersion: "v1",
        stage: "question",
        summary: "规划失败",
        status: "failed",
      });
    }
  }

  return {
    questionIntent,
    evaluationFocus,
    idealAnswerLayers,
    commonPitfalls,
    expectedEvidence,
    summary: questionIntent ? "问题意图分析已完成" : "问题意图分析失败",
    inputFingerprint: currentFingerprint,
    agentTrace: [],
  };
}

// ---- Main runner functions ----

export async function runPreReplayAgents(req: PreReplayRequest): Promise<PreReplayReport> {
  const traces: AgentTraceItem[] = [];

  // Phase 1: Material
  const { material, cached: matCached } = await resolveMaterialAnalysis({
    backgroundMaterials: req.backgroundMaterials,
    targetDirection: req.targetDirection,
    targetSchool: req.targetSchool,
    materialAnalysis: req.materialAnalysis,
  });
  traces.push({
    agentName: "材料分析器",
    agentVersion: "v1",
    stage: "material",
    summary: matCached ? "复用预分析结果" : (material.summary?.slice(0, 100) || "完成"),
    status: "success",
    usedCachedInput: matCached,
  });

  // Phase 2: Question Plan
  const mFingerprint = makeMaterialFingerprint(req.backgroundMaterials, req.targetDirection, req.targetSchool);
  const questionPlan = await resolveQuestionPlan({
    question: req.question,
    interviewType: req.interviewType,
    targetDirection: req.targetDirection,
    targetSchool: req.targetSchool,
    backgroundMaterials: req.backgroundMaterials,
    questionPlan: req.questionPlan,
    materialFingerprint: mFingerprint,
    evidenceCards: material.evidenceCards,
  }, traces);

  // Phase 3: Evidence Mapper
  const tEvidence = Date.now();
  const evidence = await runEvidenceAgent({
    question: req.question,
    answersText: `临场回答：\n${req.liveAnswer}\n\n冷静回答：\n${req.calmAnswer}`,
    evidenceCards: material.evidenceCards,
    questionIntent: questionPlan.questionIntent,
    expectedEvidence: questionPlan.expectedEvidence,
  });
  traces.push(trace("材料证据匹配器", evidence.summary, tEvidence, { stage: "diagnosis" }));

  // Phase 4: Professor + Gap in parallel with per-agent fallback
  const tParallel = Date.now();
  let professor: ProfessorAgentOutput = { riskRadar: [], followUpRisks: [], authenticityWarnings: [], pressureTests: [], summary: "" };
  let gap: GapAgentOutput = { liveAnswerDiagnosis: [], calmAnswerImprovements: [], liveLossAnalysis: [], gapClaims: [], summary: "" };

  const [pResult, gResult] = await Promise.allSettled([
    runProfessorAgent({
      question: req.question,
      answersText: `临场回答：\n${req.liveAnswer}\n\n冷静回答：\n${req.calmAnswer}`,
      evidenceCards: material.evidenceCards,
      materialRecall: evidence.materialRecall,
      targetDirection: req.targetDirection,
    }),
    runGapAgent({
      question: req.question,
      liveAnswer: req.liveAnswer,
      calmAnswer: req.calmAnswer,
      evidenceCards: material.evidenceCards,
      materialRecall: evidence.materialRecall,
    }),
  ]);

  if (pResult.status === "fulfilled") {
    professor = pResult.value;
    traces.push(trace("导师风险审查员", professor.summary, tParallel, { stage: "diagnosis" }));
  } else {
    traces.push({ agentName: "导师风险审查员", agentVersion: "v1", stage: "diagnosis", summary: "分析失败", status: "failed", errorCode: "professor_failed" });
  }
  if (gResult.status === "fulfilled") {
    gap = gResult.value;
    traces.push(trace("临场差距诊断器", gap.summary, tParallel, { stage: "diagnosis" }));
  } else {
    traces.push({ agentName: "临场差距诊断器", agentVersion: "v1", stage: "diagnosis", summary: "分析失败", status: "failed", errorCode: "gap_failed" });
  }

  // Phase 5: Synthesizer
  const tSynth = Date.now();
  const synthesizer = await runSynthesizerAgent({
    question: req.question,
    answersText: `临场回答：\n${req.liveAnswer}\n\n冷静回答：\n${req.calmAnswer}`,
    evidenceCards: material.evidenceCards,
    questionIntent: questionPlan.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    pressureTests: professor.pressureTests,
    evidenceClaims: evidence.evidenceClaims,
    expectedEvidence: questionPlan.expectedEvidence,
  });
  traces.push(trace("回答融合重构器", synthesizer.summary, tSynth, { stage: "synthesis" }));

  // Phase 6: Verifier
  const tVerify = Date.now();
  let verifier: VerifierAgentOutput = { verification: EMPTY_VERIFICATION, summary: "安全校验未运行" };
  try {
    verifier = await runVerifierAgent({
      question: req.question,
      answer: synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer,
      evidenceCards: material.evidenceCards,
      pressureTests: professor.pressureTests,
      authenticityWarnings: professor.authenticityWarnings,
      questionIntent: questionPlan.questionIntent,
    });
    traces.push(trace("回答安全校验员", verifier.summary, tVerify, { stage: "synthesis" }));
  } catch {
    verifier = { verification: { ...EMPTY_VERIFICATION, summary: "安全校验暂不可用。" }, summary: "安全校验失败" };
    traces.push({ agentName: "回答安全校验员", agentVersion: "v1", stage: "synthesis", summary: "校验失败，已保留融合回答", status: "failed", errorCode: "verifier_failed" });
  }

  const finalAnswer = verifier.verification.revisedAnswer || synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer;

  // Phase 6.5: Build Quality Summary & Maturity (pure functions)
  const qualitySummary = buildQualitySummary(evidence, professor, synthesizer, verifier, gap.gapClaims);
  const maturity = assessMaturity(evidence.materialRecall, evidence.evidenceClaims, professor.pressureTests, verifier.verification);

  // Phase 7: Training Planner
  const tTrain = Date.now();
  const training = await runTrainingAgent({
    mode: "pre",
    question: req.question,
    questionIntent: questionPlan.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    bestMergedAnswer: finalAnswer,
    qualitySummary,
    answerVerification: verifier.verification,
    maturity,
  });
  traces.push(trace("训练规划器", training.summary, tTrain, { stage: "training" }));

  const intentOutput: IntentAgentOutput = {
    questionIntent: questionPlan.questionIntent,
    evaluationFocus: questionPlan.evaluationFocus,
    idealAnswerLayers: questionPlan.idealAnswerLayers,
    commonPitfalls: questionPlan.commonPitfalls,
    summary: questionPlan.summary,
  };

  return composePreReport(material, intentOutput, evidence, professor, gap, synthesizer, verifier, training, traces, qualitySummary, maturity);
}

export async function runPostReplayAgents(req: PostReplayRequest): Promise<PostReplayReport> {
  const traces: AgentTraceItem[] = [];

  const answersText = req.answers.map((a) => `${a.label}：${a.content}`).join("\n\n");
  const bg = req.backgroundMaterials || "";

  // Phase 1: Material
  const { material, cached: matCached } = await resolveMaterialAnalysis({
    backgroundMaterials: bg,
    targetDirection: req.targetDirection,
    materialAnalysis: req.materialAnalysis,
  });
  traces.push({
    agentName: "材料分析器",
    agentVersion: "v1",
    stage: "material",
    summary: matCached ? "复用预分析结果" : (material.summary?.slice(0, 100) || "完成"),
    status: "success",
    usedCachedInput: matCached,
  });

  // Phase 2: Question Plan
  const mFingerprint = makeMaterialFingerprint(bg, req.targetDirection);
  const questionPlan = await resolveQuestionPlan({
    question: req.question,
    interviewType: req.interviewContext,
    targetDirection: req.targetDirection,
    backgroundMaterials: bg,
    questionPlan: req.questionPlan,
    materialFingerprint: mFingerprint,
    evidenceCards: material.evidenceCards,
  }, traces);

  // Phase 3: Evidence Mapper
  const tEvidence = Date.now();
  const evidence = await runEvidenceAgent({
    question: req.question,
    answersText,
    evidenceCards: material.evidenceCards,
    questionIntent: questionPlan.questionIntent,
    expectedEvidence: questionPlan.expectedEvidence,
  });
  traces.push(trace("材料证据匹配器", evidence.summary, tEvidence, { stage: "diagnosis" }));

  // Phase 4: Professor + Diff in parallel with per-agent fallback
  const tParallel = Date.now();
  let professor: ProfessorAgentOutput = { riskRadar: [], followUpRisks: [], authenticityWarnings: [], pressureTests: [], summary: "" };
  let diff: DiffAgentOutput = { answerRanking: [], versionReviews: [], versionClaims: [], sentenceDiagnosis: [], summary: "" };

  const [pResult, dResult] = await Promise.allSettled([
    runProfessorAgent({
      question: req.question,
      answersText,
      evidenceCards: material.evidenceCards,
      materialRecall: evidence.materialRecall,
      targetDirection: req.targetDirection,
    }),
    runDiffAgent({
      question: req.question,
      answers: req.answers,
      evidenceCards: material.evidenceCards,
      materialRecall: evidence.materialRecall,
    }),
  ]);

  if (pResult.status === "fulfilled") {
    professor = pResult.value;
    traces.push(trace("导师风险审查员", professor.summary, tParallel, { stage: "diagnosis" }));
  } else {
    traces.push({ agentName: "导师风险审查员", agentVersion: "v1", stage: "diagnosis", summary: "分析失败", status: "failed", errorCode: "professor_failed" });
  }
  if (dResult.status === "fulfilled") {
    diff = dResult.value;
    traces.push(trace("多版本差异诊断器", diff.summary, tParallel, { stage: "diagnosis" }));
  } else {
    traces.push({ agentName: "多版本差异诊断器", agentVersion: "v1", stage: "diagnosis", summary: "分析失败", status: "failed", errorCode: "diff_failed" });
  }

  // Phase 5: Synthesizer
  const tSynth = Date.now();
  const synthesizer = await runSynthesizerAgent({
    question: req.question,
    answersText,
    evidenceCards: material.evidenceCards,
    questionIntent: questionPlan.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    pressureTests: professor.pressureTests,
    evidenceClaims: evidence.evidenceClaims,
    expectedEvidence: questionPlan.expectedEvidence,
  });
  traces.push(trace("回答融合重构器", synthesizer.summary, tSynth, { stage: "synthesis" }));

  // Phase 6: Verifier
  const tVerify = Date.now();
  let verifier: VerifierAgentOutput = { verification: EMPTY_VERIFICATION, summary: "安全校验未运行" };
  try {
    verifier = await runVerifierAgent({
      question: req.question,
      answer: synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer,
      evidenceCards: material.evidenceCards,
      pressureTests: professor.pressureTests,
      authenticityWarnings: professor.authenticityWarnings,
      questionIntent: questionPlan.questionIntent,
    });
    traces.push(trace("回答安全校验员", verifier.summary, tVerify, { stage: "synthesis" }));
  } catch {
    verifier = { verification: { ...EMPTY_VERIFICATION, summary: "安全校验暂不可用。" }, summary: "安全校验失败" };
    traces.push({ agentName: "回答安全校验员", agentVersion: "v1", stage: "synthesis", summary: "校验失败，已保留融合回答", status: "failed", errorCode: "verifier_failed" });
  }

  const finalAnswer = verifier.verification.revisedAnswer || synthesizer.safeAnswer.answer60s || synthesizer.bestMergedAnswer;

  // Phase 6.5: Build Quality Summary & Maturity (pure functions)
  const qualitySummary = buildQualitySummary(evidence, professor, synthesizer, verifier, diff.versionClaims);
  const maturity = assessMaturity(evidence.materialRecall, evidence.evidenceClaims, professor.pressureTests, verifier.verification);

  // Phase 7: Training Planner
  const tTrain = Date.now();
  const training = await runTrainingAgent({
    mode: "post",
    question: req.question,
    questionIntent: questionPlan.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    bestMergedAnswer: finalAnswer,
    qualitySummary,
    answerVerification: verifier.verification,
    maturity,
  });
  traces.push(trace("训练规划器", training.summary, tTrain, { stage: "training" }));

  const intentOutput: IntentAgentOutput = {
    questionIntent: questionPlan.questionIntent,
    evaluationFocus: questionPlan.evaluationFocus,
    idealAnswerLayers: questionPlan.idealAnswerLayers,
    commonPitfalls: questionPlan.commonPitfalls,
    summary: questionPlan.summary,
  };

  return composePostReport(material, intentOutput, evidence, professor, diff, synthesizer, verifier, training, traces, qualitySummary, maturity);
}
