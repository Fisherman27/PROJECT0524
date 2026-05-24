"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PostReplayForm } from "@/features/post-replay/post-replay-form";
import { PostReplayResult } from "@/features/post-replay/post-replay-result";
import { LoadingState } from "@/components/loading-state";
import { ErrorPanel } from "@/components/error-panel";
import { AgentPipeline } from "@/components/agent-pipeline";
import { generatePostReport } from "@/features/post-replay/post-replay-client";
import { PostReplayRequest, PostReplayResponse, QuestionPreAnalysis, MaterialPreAnalysis } from "@/types/replay";
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
            <LoadingState />
            {error && <ErrorPanel message={error} onRetry={() => setError(null)} />}
          </div>
          <div className="w-56 flex-shrink-0">
            <div className="sticky top-20">
              <AgentPipeline mode="post" animating />
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
              <AgentPipeline mode="post" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
