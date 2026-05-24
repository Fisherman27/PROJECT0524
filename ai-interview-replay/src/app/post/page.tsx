"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PostReplayForm } from "@/features/post-replay/post-replay-form";
import { PostReplayResult } from "@/features/post-replay/post-replay-result";
import { LoadingState } from "@/components/loading-state";
import { ErrorPanel } from "@/components/error-panel";
import { AgentPipeline } from "@/components/agent-pipeline";
import { StepGuide } from "@/components/step-guide";
import { generatePostReport } from "@/features/post-replay/post-replay-client";
import { AgentTraceItem, PostReplayRequest, PostReplayResponse, QuestionPreAnalysis } from "@/types/replay";
import { useInterviewContext } from "@/lib/interview-context";
import Link from "next/link";

function makePlanKey(question: string, materialFingerprint: string): string {
  return `${question}::${materialFingerprint}`;
}

export default function PostPage() {
  const {
    data: ctx, fullMaterials,
    materialAnalysis, questionPlans, setQuestionPlan,
  } = useInterviewContext();
  const [result, setResult] = useState<PostReplayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionPlan, setCurrentQuestionPlan] = useState<QuestionPreAnalysis | null>(null);
  const [planningQuestion, setPlanningQuestion] = useState(false);
  const [planError, setPlanError] = useState("");
  const lastPlanKey = useRef("");

  const bg = {
    interviewType: ctx.interviewType,
    targetDirection: ctx.targetDirection,
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
  }, [materialAnalysis, questionPlans, setQuestionPlan, ctx.interviewType, ctx.targetDirection]);

  const handleSubmit = async (formData: PostReplayRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fullReq: PostReplayRequest = { ...formData };
      if (materialAnalysis) {
        fullReq.materialAnalysis = materialAnalysis;
      }
      if (currentQuestionPlan) {
        fullReq.questionPlan = currentQuestionPlan;
      }
      const res = await generatePostReport(fullReq);
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
        <span className="text-gray-500">面试后复盘</span>
      </div>

      {/* Loading state: spinner + agent pipeline */}
      {loading && (
        <div className="flex gap-6">
          <div className="flex-1">
            <LoadingState
              text="正在生成面试后复盘..."
              steps={[
                "复用材料证据库",
                "比较多个回答版本",
                "识别导师追问风险",
                "生成最佳安全回答",
                "提炼可迁移回答公式",
              ]}
            />
            {error && <ErrorPanel message={error} onRetry={() => setError(null)} />}
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline mode="post" traces={getPreAnalysisTraces()} animating />
            </div>
          </div>
        </div>
      )}

      {/* Result state: report + real agent pipeline */}
      {result && !loading && (
        <div className="flex gap-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-500">面试后复盘 — 复盘完成</h1>
              <button
                onClick={handleNewRound}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                + 新一轮复盘
              </button>
            </div>
            <PostReplayResult report={result.report} copyText={result.copyText} />
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline mode="post" traces={result.report.agentTrace} />
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
                <h1 className="text-xl font-bold text-gray-900">面试后复盘</h1>
                <p className="mt-1 text-sm text-gray-500">
                  输入真实面试问题和多个回答版本 — 从导师视角诊断哪种说法更稳。
                </p>
              </div>
            )}
            <StepGuide
              steps={[
                { title: "填写真实问题", description: "尽量还原导师原话" },
                { title: "添加回答版本", description: "至少两个版本用于比较" },
                { title: "比较与诊断", description: "识别更稳表达和追问风险" },
                { title: "提炼公式", description: "沉淀下一次可复用说法" },
              ]}
            />
            {!materialAnalysis && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                <span className="mr-1 select-none">&#9432;</span>
                建议先
                <Link href="/" className="mx-0.5 font-medium text-amber-800 underline underline-offset-2">回首页分析材料</Link>
                。材料证据库越完整，多版本比较越能判断哪些表达有支撑。
              </div>
            )}
            <PostReplayForm
              onSubmit={handleSubmit}
              loading={loading}
              bg={bg}
              onQuestionReady={handleQuestionReady}
              planningQuestion={planningQuestion}
              planError={planError}
              questionPlan={currentQuestionPlan}
            />
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline
                mode="post"
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
