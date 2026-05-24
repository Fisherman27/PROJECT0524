"use client";

import { useState, useEffect, useRef } from "react";
import { AnswerVersionCard } from "@/components/answer-version-card";
import { useAnswerVersions } from "./use-answer-versions";
import { PostReplayRequest, QuestionPreAnalysis } from "@/types/replay";

interface BackgroundFromHome {
  interviewType: string;
  targetDirection: string;
  backgroundMaterials: string;
}

interface PostReplayFormProps {
  onSubmit: (data: PostReplayRequest) => void;
  loading: boolean;
  bg: BackgroundFromHome;
  onQuestionReady?: (question: string) => void;
  planningQuestion?: boolean;
  planError?: string;
  questionPlan?: QuestionPreAnalysis | null;
}

export function PostReplayForm({
  onSubmit, loading, bg,
  onQuestionReady, planningQuestion, planError, questionPlan,
}: PostReplayFormProps) {
  const [question, setQuestion] = useState("");
  const questionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    versions,
    validCount,
    updateContent,
    updateSource,
    addVersion,
    removeVersion,
    reset: resetVersions,
  } = useAnswerVersions();

  const canSubmit = question.trim() && validCount >= 2 && !loading;

  // Trigger question planning on question change (debounced)
  useEffect(() => {
    if (!onQuestionReady) return;
    const q = question.trim();
    if (!q) return;

    if (questionTimer.current) clearTimeout(questionTimer.current);
    questionTimer.current = setTimeout(() => onQuestionReady(q), 800);

    return () => {
      if (questionTimer.current) clearTimeout(questionTimer.current);
    };
  }, [question, onQuestionReady]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const validAnswers = versions
      .filter((v) => v.content.trim())
      .map((v) => ({
        label: v.label,
        source: v.source,
        content: v.content,
      }));

    onSubmit({
      question,
      interviewContext: bg.interviewType,
      targetDirection: bg.targetDirection,
      backgroundMaterials: bg.backgroundMaterials || undefined,
      answers: validAnswers,
    });
  };

  const handleClear = () => {
    setQuestion("");
    resetVersions();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">面试问题</h2>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="面试中被问到的具体问题"
          rows={2}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        {/* Question analysis status */}
        {question.trim() && onQuestionReady && (
          <p className="mt-2 text-xs text-gray-400">
            {planningQuestion ? "问题分析中..."
              : planError ? `问题分析：${planError}（最终复盘时会自动补充）`
              : "问题分析已完成"}
          </p>
        )}

        {/* Question plan display (visible for post mode) */}
        {questionPlan && questionPlan.questionIntent && (
          <div className="mt-4 space-y-2 rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-800">本题考察意图</p>
            <p className="text-xs text-blue-700">{questionPlan.questionIntent}</p>
            {questionPlan.expectedEvidence.length > 0 && (
              <>
                <p className="mt-2 text-xs font-medium text-blue-800">建议调用材料</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {questionPlan.expectedEvidence.map((e, i) => (
                    <li key={i} className="text-xs text-blue-600">
                      {e.evidenceCardTitle}
                      {e.priority === "high" && "（优先）"}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">回答版本（至少填写 2 个）</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {validCount}/{versions.length} 个已填写
            </span>
            {versions.length < 6 && (
              <button
                type="button"
                onClick={addVersion}
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                + 添加版本
              </button>
            )}
          </div>
        </div>

        {versions.map((v) => (
          <AnswerVersionCard
            key={v.id}
            version={v}
            canRemove={versions.length > 2}
            onContentChange={(c) => updateContent(v.id, c)}
            onSourceChange={(s) => updateSource(v.id, s)}
            onRemove={() => removeVersion(v.id)}
          />
        ))}

        {validCount < 2 && (
          <p className="text-xs text-orange-500">至少需要填写 2 个有效回答版本才能提交</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "分析中..." : "生成复盘报告"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          清空
        </button>
      </div>
    </form>
  );
}
