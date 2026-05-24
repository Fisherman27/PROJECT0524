import { PreReplayRequest, PostReplayRequest, PreReplayReport, PostReplayReport, AgentTraceItem } from "@/types/replay";
import { runMaterialAgent } from "./material-agent";
import { runIntentAgent } from "./intent-agent";
import { runEvidenceAgent } from "./evidence-agent";
import { runProfessorAgent } from "./professor-agent";
import { runGapAgent } from "./gap-agent";
import { runDiffAgent } from "./diff-agent";
import { runSynthesizerAgent } from "./synthesizer-agent";
import { runTrainingAgent } from "./training-agent";
import { composePreReport, composePostReport } from "./composer";

function trace(agentName: string, summary: string, startMs: number): AgentTraceItem {
  return {
    agentName,
    summary: summary.slice(0, 100),
    status: "success",
    durationMs: Date.now() - startMs,
  };
}

export async function runPreReplayAgents(req: PreReplayRequest): Promise<PreReplayReport> {
  const traces: AgentTraceItem[] = [];

  // 1. Material Analyst
  const t0 = Date.now();
  const material = await runMaterialAgent({
    backgroundMaterials: req.backgroundMaterials,
    targetDirection: req.targetDirection,
    targetSchool: req.targetSchool,
  });
  traces.push(trace("材料分析器", material.summary, t0));

  // 2. Intent
  const t1 = Date.now();
  const intent = await runIntentAgent({
    question: req.question,
    interviewType: req.interviewType,
    targetDirection: req.targetDirection,
    targetSchool: req.targetSchool,
  });
  traces.push(trace("问题意图分析器", intent.summary, t1));

  // 3. Evidence Mapper
  const t2 = Date.now();
  const evidence = await runEvidenceAgent({
    question: req.question,
    answersText: `临场回答：\n${req.liveAnswer}\n\n冷静回答：\n${req.calmAnswer}`,
    evidenceCards: material.evidenceCards,
    questionIntent: intent.questionIntent,
  });
  traces.push(trace("材料证据匹配器", evidence.summary, t2));

  // 4. Professor
  const t3 = Date.now();
  const professor = await runProfessorAgent({
    question: req.question,
    answersText: `临场回答：\n${req.liveAnswer}\n\n冷静回答：\n${req.calmAnswer}`,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    targetDirection: req.targetDirection,
  });
  traces.push(trace("导师风险审查员", professor.summary, t3));

  // 5. Gap Diagnoser
  const t4 = Date.now();
  const gap = await runGapAgent({
    question: req.question,
    liveAnswer: req.liveAnswer,
    calmAnswer: req.calmAnswer,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
  });
  traces.push(trace("临场差距诊断器", gap.summary, t4));

  // 6. Synthesizer
  const t5 = Date.now();
  const synthesizer = await runSynthesizerAgent({
    question: req.question,
    answersText: `临场回答：\n${req.liveAnswer}\n\n冷静回答：\n${req.calmAnswer}`,
    evidenceCards: material.evidenceCards,
    questionIntent: intent.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
  });
  traces.push(trace("回答融合重构器", synthesizer.summary, t5));

  // 7. Training Planner
  const t6 = Date.now();
  const training = await runTrainingAgent({
    mode: "pre",
    question: req.question,
    questionIntent: intent.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    bestMergedAnswer: synthesizer.bestMergedAnswer,
  });
  traces.push(trace("训练规划器", training.summary, t6));

  return composePreReport(material, intent, evidence, professor, gap, synthesizer, training, traces);
}

export async function runPostReplayAgents(req: PostReplayRequest): Promise<PostReplayReport> {
  const traces: AgentTraceItem[] = [];

  const answersText = req.answers.map((a) => `${a.label}：${a.content}`).join("\n\n");
  const bg = req.backgroundMaterials || "";

  // 1. Material Analyst
  const t0 = Date.now();
  const material = await runMaterialAgent({
    backgroundMaterials: bg,
    targetDirection: req.targetDirection,
  });
  traces.push(trace("材料分析器", material.summary, t0));

  // 2. Intent
  const t1 = Date.now();
  const intent = await runIntentAgent({
    question: req.question,
    interviewType: req.interviewContext,
    targetDirection: req.targetDirection,
  });
  traces.push(trace("问题意图分析器", intent.summary, t1));

  // 3. Evidence Mapper
  const t2 = Date.now();
  const evidence = await runEvidenceAgent({
    question: req.question,
    answersText,
    evidenceCards: material.evidenceCards,
    questionIntent: intent.questionIntent,
  });
  traces.push(trace("材料证据匹配器", evidence.summary, t2));

  // 4. Professor
  const t3 = Date.now();
  const professor = await runProfessorAgent({
    question: req.question,
    answersText,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
    targetDirection: req.targetDirection,
  });
  traces.push(trace("导师风险审查员", professor.summary, t3));

  // 5. Answer Diff
  const t4 = Date.now();
  const diff = await runDiffAgent({
    question: req.question,
    answers: req.answers,
    evidenceCards: material.evidenceCards,
    materialRecall: evidence.materialRecall,
  });
  traces.push(trace("多版本差异诊断器", diff.summary, t4));

  // 6. Synthesizer
  const t5 = Date.now();
  const synthesizer = await runSynthesizerAgent({
    question: req.question,
    answersText,
    evidenceCards: material.evidenceCards,
    questionIntent: intent.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
  });
  traces.push(trace("回答融合重构器", synthesizer.summary, t5));

  // 7. Training Planner
  const t6 = Date.now();
  const training = await runTrainingAgent({
    mode: "post",
    question: req.question,
    questionIntent: intent.questionIntent,
    materialRecall: evidence.materialRecall,
    riskRadar: professor.riskRadar,
    authenticityWarnings: professor.authenticityWarnings,
    bestMergedAnswer: synthesizer.bestMergedAnswer,
  });
  traces.push(trace("训练规划器", training.summary, t6));

  return composePostReport(material, intent, evidence, professor, diff, synthesizer, training, traces);
}
