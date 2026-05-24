"use client";

import { useState } from "react";
import { FormField } from "@/components/form-field";
import { PostReplayRequest } from "@/types/replay";

interface PostReplayFormProps {
  onSubmit: (data: PostReplayRequest) => void;
  loading: boolean;
  defaults?: {
    interviewContext?: string;
    targetDirection?: string;
    backgroundMaterials?: string;
  };
}

export function PostReplayForm({ onSubmit, loading, defaults = {} }: PostReplayFormProps) {
  const [question, setQuestion] = useState("");
  const [interviewContext, setInterviewContext] = useState(defaults.interviewContext || "");
  const [targetDirection, setTargetDirection] = useState(defaults.targetDirection || "");
  const [backgroundMaterials, setBackgroundMaterials] = useState(defaults.backgroundMaterials || "");

  const defaultAnswers = [
    { label: "A", source: "真实回答", content: "" },
    { label: "B", source: "事后想到", content: "" },
    { label: "C", source: "同学/学长/AI建议", content: "" },
  ];
  const [answers, setAnswers] = useState(defaultAnswers);

  const updateAnswer = (index: number, content: string) => {
    const next = [...answers];
    next[index] = { ...next[index], content };
    setAnswers(next);
  };

  const canSubmit =
    question.trim() &&
    interviewContext.trim() &&
    targetDirection.trim() &&
    answers.filter((a) => a.content.trim()).length >= 2 &&
    !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const validAnswers = answers
      .filter((a) => a.content.trim())
      .map((a) => ({
        label: a.label,
        source: a.source,
        content: a.content,
      }));

    onSubmit({
      question,
      interviewContext,
      targetDirection,
      backgroundMaterials: backgroundMaterials || undefined,
      answers: validAnswers,
    });
  };

  const handleClear = () => {
    setQuestion("");
    setInterviewContext("");
    setTargetDirection("");
    setBackgroundMaterials("");
    setAnswers(defaultAnswers.map((a) => ({ ...a, content: "" })));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">面试信息</h2>
        <FormField label="真实面试问题" name="question" value={question} onChange={setQuestion} placeholder="面试中被问到的具体问题" type="textarea" rows={2} required />
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <FormField label="面试场景" name="interviewContext" value={interviewContext} onChange={setInterviewContext} placeholder="夏令营 / 预推免 / 导师组面试..." required />
          <FormField label="目标方向" name="targetDirection" value={targetDirection} onChange={setTargetDirection} placeholder="如：人工智能 / NLP" required />
        </div>
        <div className="mt-4">
          <FormField label="背景材料" name="backgroundMaterials" value={backgroundMaterials} onChange={setBackgroundMaterials} placeholder="简历、科研经历等（选填，但建议填写以获得更准诊断）" type="textarea" rows={4} optional />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">回答版本（至少填写2个）</h2>
        {answers.map((answer, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                回答 {answer.label}
              </span>
              <span className="text-xs text-gray-400">{answer.source}</span>
            </div>
            <FormField
              label=""
              name={`answer-${i}`}
              value={answer.content}
              onChange={(v) => updateAnswer(i, v)}
              placeholder={`输入${answer.source}...`}
              type="textarea"
              rows={4}
            />
          </div>
        ))}
        <p className="text-xs text-gray-400">已回答 {answers.filter((a) => a.content.trim()).length}/3 个版本</p>
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
