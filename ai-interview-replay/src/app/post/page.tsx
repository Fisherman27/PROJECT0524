"use client";

import { useState } from "react";
import { PostReplayForm } from "@/features/post-replay/post-replay-form";
import { PostReplayResult } from "@/features/post-replay/post-replay-result";
import { LoadingState } from "@/components/loading-state";
import { ErrorPanel } from "@/components/error-panel";
import { generatePostReport } from "@/features/post-replay/post-replay-client";
import { PostReplayRequest, PostReplayResponse } from "@/types/replay";
import { useInterviewContext } from "@/lib/interview-context";
import Link from "next/link";

export default function PostPage() {
  const { data: ctx, fullMaterials } = useInterviewContext();
  const [result, setResult] = useState<PostReplayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = {
    interviewType: ctx.interviewType,
    targetDirection: ctx.targetDirection,
    backgroundMaterials: fullMaterials,
  };

  const handleSubmit = async (formData: PostReplayRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await generatePostReport(formData);
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

      {!result && !loading && !error && (
        <div>
          <h1 className="text-xl font-bold text-gray-900">面试后复盘</h1>
          <p className="mt-1 text-sm text-gray-500">
            输入真实面试问题和多个回答版本 — 从导师视角诊断哪种说法更稳。
          </p>
        </div>
      )}

      {error && <ErrorPanel message={error} onRetry={() => setError(null)} />}
      {loading && <LoadingState />}

      {result && !loading && (
        <>
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
        </>
      )}

      {!result && !loading && <PostReplayForm onSubmit={handleSubmit} loading={loading} bg={bg} />}
    </div>
  );
}
