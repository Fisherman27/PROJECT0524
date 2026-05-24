"use client";

import { useState, useCallback } from "react";
import { FormField } from "@/components/form-field";
import { TimerControl } from "@/components/timer-control";
import { generateQuestion } from "./pre-replay-client";
import { usePreAnswerTimer } from "./use-pre-answer-timer";
import { PreReplayRequest } from "@/types/replay";

interface BackgroundFromHome {
  interviewType: string;
  targetDirection: string;
  targetSchool: string;
  backgroundMaterials: string;
}

interface PreReplayFormProps {
  onSubmit: (data: PreReplayRequest) => void;
  loading: boolean;
  bg: BackgroundFromHome;
}

export function PreReplayForm({ onSubmit, loading, bg }: PreReplayFormProps) {
  const [question, setQuestion] = useState("");
  const [liveAnswer, setLiveAnswer] = useState("");
  const [calmAnswer, setCalmAnswer] = useState("");
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [questionReason, setQuestionReason] = useState("");
  const [questionError, setQuestionError] = useState("");

  const {
    stage,
    prepSecondsLeft,
    answerSecondsLeft,
    answerDuration,
    setDuration,
    startPreparation,
    startAnswering,
    lockAnswer,
    resetRound,
  } = usePreAnswerTimer({
    defaultDurationSeconds: 60,
    preparationSeconds: 5,
    onAbandoned: () => {},
    onLocked: () => {},
  });

  const canGenQuestion = bg.backgroundMaterials.trim().length > 0 && !generatingQuestion;
  const canEnterPreparation = question.trim() && stage === "editing";
  const canSubmit = liveAnswer.trim() && calmAnswer.trim() && stage === "liveLocked" && !loading;

  const handleGenerateQuestion = useCallback(async () => {
    setGeneratingQuestion(true);
    setQuestionError("");
    try {
      const result = await generateQuestion({
        interviewType: bg.interviewType || undefined,
        targetDirection: bg.targetDirection || undefined,
        backgroundMaterials: bg.backgroundMaterials,
      });
      setQuestion(result.question);
      setQuestionReason(result.reason);
    } catch (e) {
      setQuestionError(e instanceof Error ? e.message : "生成问题失败");
    } finally {
      setGeneratingQuestion(false);
    }
  }, [bg.interviewType, bg.targetDirection, bg.backgroundMaterials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      interviewType: bg.interviewType,
      targetDirection: bg.targetDirection,
      targetSchool: bg.targetSchool || undefined,
      backgroundMaterials: bg.backgroundMaterials,
      question,
      liveAnswer,
      calmAnswer,
    });
  };

  const handleClear = () => {
    setQuestion("");
    setLiveAnswer("");
    setCalmAnswer("");
    setQuestionReason("");
    setQuestionError("");
    resetRound();
  };

  const timeProgress = answerDuration > 0 ? (answerSecondsLeft / answerDuration) * 100 : 0;
  const isUrgent = answerSecondsLeft <= 10;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* STEP 1: Select question + timer settings */}
      {stage === "editing" && (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">面试问题</h2>
              <button
                type="button"
                onClick={handleGenerateQuestion}
                disabled={!canGenQuestion}
                className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingQuestion ? "生成中..." : "AI 生成练习问题"}
              </button>
            </div>
            {questionReason && <p className="mb-2 text-xs text-gray-400">建议原因：{questionReason}</p>}
            {questionError && <p className="mb-2 text-xs text-red-500">生成失败：{questionError}</p>}
            <FormField label="" name="question" value={question} onChange={setQuestion} placeholder="输入面试问题，或点击上方按钮根据你的背景材料生成" type="textarea" rows={2} required />
          </div>

          {question.trim() && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-gray-800">作答设置</h2>
              <p className="mb-3 text-xs text-gray-400">倒计时结束后临场回答将被自动锁定，你也可以提前手动锁定。</p>
              <TimerControl duration={answerDuration} onDurationChange={setDuration} disabled={false} />
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={startPreparation} disabled={!canEnterPreparation} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              进入临场作答
            </button>
            <button type="button" onClick={handleClear} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              清空
            </button>
          </div>
        </>
      )}

      {/* STEP 2: Ready (5s countdown) */}
      {stage === "ready" && (
        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">准备作答</h2>
          <div className="mx-auto mb-4 max-w-lg rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700">{question}</p>
          </div>
          <p className="mb-2 text-3xl font-bold text-orange-600">{prepSecondsLeft}</p>
          <p className="mb-6 text-sm text-gray-500">{prepSecondsLeft > 0 ? "秒内点击下方按钮开始作答，否则视为放弃" : "时间到！"}</p>
          <button type="button" onClick={startAnswering} className="rounded-lg bg-orange-500 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-orange-600">
            开始作答
          </button>
        </div>
      )}

      {/* STEP 3: Abandoned */}
      {stage === "abandoned" && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <h2 className="mb-2 text-lg font-semibold text-red-700">已视为放弃临场回答</h2>
          <p className="mb-6 text-sm text-red-600">你未在 5 秒内开始作答。请重新开始本轮模拟。</p>
          <button type="button" onClick={resetRound} className="rounded-lg bg-red-500 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-red-600">
            重新开始
          </button>
        </div>
      )}

      {/* STEP 4: Live Answering */}
      {stage === "liveAnswering" && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-orange-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">临场作答中</h2>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-mono font-bold ${isUrgent ? "text-red-600" : "text-orange-600"}`}>{answerSecondsLeft}s</span>
                <button type="button" onClick={lockAnswer} className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
                  提前锁定
                </button>
              </div>
            </div>
            <div className="mb-4 h-1.5 rounded-full bg-gray-100">
              <div className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? "bg-red-500" : "bg-orange-400"}`} style={{ width: `${timeProgress}%` }} />
            </div>
            <div className="mb-3 rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700">{question}</p>
            </div>
            <textarea value={liveAnswer} onChange={(e) => setLiveAnswer(e.target.value)} placeholder="在倒计时结束前写下你的临场回答..." rows={5} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      )}

      {/* STEP 5: Live locked + Calm answer + Submit */}
      {stage === "liveLocked" && (
        <>
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-lg font-semibold text-green-800">临场回答已锁定</h2>
            </div>
            <div className="mb-2 rounded-lg bg-white p-3">
              <p className="text-sm text-gray-600">{liveAnswer || "（未填写内容）"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-lg font-semibold text-blue-700">冷静回答</h2>
            <p className="mb-3 text-xs text-gray-400">冷静思考后重新组织回答。试试补充临场时遗漏的关键内容。</p>
            <FormField label="" name="calmAnswer" value={calmAnswer} onChange={setCalmAnswer} placeholder="写出你冷静后想到的回答..." type="textarea" rows={5} required />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={!canSubmit} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "分析中..." : "生成复盘报告"}
            </button>
            <button type="button" onClick={handleClear} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              清空
            </button>
          </div>
        </>
      )}
    </form>
  );
}
