"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PreReplayForm } from "@/features/pre-replay/pre-replay-form";
import { PreReplayResult } from "@/features/pre-replay/pre-replay-result";
import { LoadingState } from "@/components/loading-state";
import { ErrorPanel } from "@/components/error-panel";
import { AgentPipeline } from "@/components/agent-pipeline";
import { StepGuide } from "@/components/step-guide";
import { generatePreReport } from "@/features/pre-replay/pre-replay-client";
import { AgentTraceItem, PreReplayRequest, PreReplayResponse, QuestionPreAnalysis } from "@/types/replay";
import { useInterviewContext } from "@/lib/interview-context";
import Link from "next/link";

function makePlanKey(question: string, materialFingerprint: string): string {
  return `${question}::${materialFingerprint}`;
}

export default function PrePage() {
  const {
    data: ctx, fullMaterials,
    materialAnalysis, questionPlans, setQuestionPlan,
  } = useInterviewContext();
  const [result, setResult] = useState<PreReplayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionPlan, setCurrentQuestionPlan] = useState<QuestionPreAnalysis | null>(null);
  const [planningQuestion, setPlanningQuestion] = useState(false);
  const [planError, setPlanError] = useState("");
  const lastPlanKey = useRef("");

  const bg = {
    interviewType: ctx.interviewType,
    targetDirection: ctx.targetDirection,
    targetSchool: ctx.targetSchool,
    backgroundMaterials: fullMaterials,
  };

  const getPreAnalysisTraces = (): AgentTraceItem[] | undefined => {
    const traces: AgentTraceItem[] = [];
    if (materialAnalysis) {
      traces.push({
        agentName: "材料分析器",
        agentVersion: "v1",
        stage: "material",
        summary: materialAnalysis.summary || "材料分析完成",
        status: "success",
        usedCachedInput: true,
      });
    }
    if (currentQuestionPlan) {
      traces.push(...currentQuestionPlan.agentTrace);
    }
    return traces.length > 0 ? traces : undefined;
  };

  const handleQuestionReady = useCallback(async (question: string) => {
    if (!question.trim() || !materialAnalysis) {
      setCurrentQuestionPlan(null);
      return;
    }

    const key = makePlanKey(question, materialAnalysis.inputFingerprint);
    if (key === lastPlanKey.current) return;

    if (questionPlans[key]) {
      setCurrentQuestionPlan(questionPlans[key]);
      lastPlanKey.current = key;
      return;
    }

    lastPlanKey.current = key;
    setPlanningQuestion(true);
    setPlanError("");
    try {
      const res = await fetch("/api/agents/question-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          interviewType: ctx.interviewType || undefined,
          targetDirection: ctx.targetDirection || undefined,
          targetSchool: ctx.targetSchool || undefined,
          evidenceCards: materialAnalysis.evidenceCards,
          materialFingerprint: materialAnalysis.inputFingerprint,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPlanError(json?.error?.message || "问题分析暂不可用");
        setCurrentQuestionPlan(null);
        return;
      }
      const plan = json as QuestionPreAnalysis;
      setCurrentQuestionPlan(plan);
      setQuestionPlan(key, plan);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "网络错误");
      setCurrentQuestionPlan(null);
    } finally {
      setPlanningQuestion(false);
    }
  }, [materialAnalysis, questionPlans, setQuestionPlan, ctx.interviewType, ctx.targetDirection, ctx.targetSchool]);

  const handleSubmit = async (formData: PreReplayRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fullReq: PreReplayRequest = { ...formData };
      if (materialAnalysis) {
        fullReq.materialAnalysis = materialAnalysis;
      }
      if (currentQuestionPlan) {
        fullReq.questionPlan = currentQuestionPlan;
      }
      const res = await generatePreReport(fullReq);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleNewRound = () => {
    setResult(null);
    setError(null);
    setCurrentQuestionPlan(null);
    lastPlanKey.current = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-blue-600">
          首页
        </Link>
        <span>/</span>
        <span className="text-gray-500">面试前模拟</span>
      </div>

      {/* Loading state: spinner + agent pipeline */}
      {loading && (
        <div className="flex gap-6">
          <div className="flex-1">
            <LoadingState
              text="正在生成面试前复盘..."
              steps={[
                "复用材料证据库",
                "匹配回答中的材料证据",
                "分析临场损失",
                "模拟导师追问风险",
                "生成最佳安全回答",
              ]}
            />
            {error && <ErrorPanel message={error} onRetry={() => setError(null)} />}
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline mode="pre" traces={getPreAnalysisTraces()} animating />
            </div>
          </div>
        </div>
      )}

      {/* Result state: report + real agent pipeline */}
      {result && !loading && (
        <div className="flex gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-500">面试前模拟 — 复盘完成</h1>
              <button
                onClick={handleNewRound}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                + 新一轮复盘
              </button>
            </div>
            <PreReplayResult report={result.report} copyText={result.copyText} />
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline mode="pre" traces={result.report.agentTrace} />
            </div>
          </div>
        </div>
      )}

      {/* Error-only state (before loading) */}
      {error && !loading && !result && (
        <ErrorPanel message={error} onRetry={() => setError(null)} />
      )}

      {/* Form state: form + pending pipeline */}
      {!result && !loading && (
        <div className="flex gap-6">
          <div className="min-w-0 flex-1">
            {!error && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">面试前模拟</h1>
                <p className="mt-1 text-sm text-gray-500">
                  限时临场作答 + 冷静重答 — 发现紧张时你丢掉了哪些关键信息。
                </p>
              </div>
            )}
            <StepGuide
              steps={[
                { title: "确认问题", description: "输入或生成一道练习题" },
                { title: "临场作答", description: "限时写下真实表达" },
                { title: "冷静重答", description: "补充遗漏证据和逻辑" },
                { title: "生成复盘", description: "查看损失、风险和救场模板" },
              ]}
            />
            {!materialAnalysis && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                <span className="mr-1 select-none">&#9432;</span>
                建议先
                <Link href="/" className="mx-0.5 font-medium text-amber-800 underline underline-offset-2">回首页分析材料</Link>
                ，这样系统能提前生成证据库；也可以继续填写，最终评审时会自动补跑。
              </div>
            )}
            <PreReplayForm
              onSubmit={handleSubmit}
              loading={loading}
              bg={bg}
              onQuestionReady={handleQuestionReady}
              planningQuestion={planningQuestion}
              planError={planError}
            />
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline
                mode="pre"
                traces={getPreAnalysisTraces()}
                runningStages={planningQuestion ? ["question"] : []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
