"use client";

import { useState, useCallback } from "react";
import { FormField } from "@/components/form-field";
import { generateQuestion } from "./pre-replay-client";
import { PreReplayRequest } from "@/types/replay";

interface PreReplayFormProps {
  onSubmit: (data: PreReplayRequest) => void;
  loading: boolean;
  defaults?: {
    interviewType?: string;
    targetDirection?: string;
    targetSchool?: string;
    backgroundMaterials?: string;
  };
}

export function PreReplayForm({ onSubmit, loading, defaults = {} }: PreReplayFormProps) {
  const [interviewType, setInterviewType] = useState(defaults.interviewType || "");
  const [targetDirection, setTargetDirection] = useState(defaults.targetDirection || "");
  const [targetSchool, setTargetSchool] = useState(defaults.targetSchool || "");
  const [backgroundMaterials, setBackgroundMaterials] = useState(defaults.backgroundMaterials || "");
  const [question, setQuestion] = useState("");
  const [liveAnswer, setLiveAnswer] = useState("");
  const [calmAnswer, setCalmAnswer] = useState("");
  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [questionReason, setQuestionReason] = useState("");

  const canGenerateQuestion = backgroundMaterials.trim().length > 0 && !generatingQuestion && !loading;
  const canSubmit =
    interviewType.trim() &&
    targetDirection.trim() &&
    backgroundMaterials.trim() &&
    question.trim() &&
    liveAnswer.trim() &&
    calmAnswer.trim() &&
    !loading;

  const handleGenerateQuestion = useCallback(async () => {
    setGeneratingQuestion(true);
    try {
      const result = await generateQuestion({
        interviewType: interviewType || undefined,
        targetDirection: targetDirection || undefined,
        backgroundMaterials,
      });
      setQuestion(result.question);
      setQuestionReason(result.reason);
    } catch {
      void 0;
    } finally {
      setGeneratingQuestion(false);
    }
  }, [interviewType, targetDirection, backgroundMaterials]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      interviewType,
      targetDirection,
      targetSchool: targetSchool || undefined,
      backgroundMaterials,
      question,
      liveAnswer,
      calmAnswer,
    });
  };

  const handleClear = () => {
    setInterviewType("");
    setTargetDirection("");
    setTargetSchool("");
    setBackgroundMaterials("");
    setQuestion("");
    setLiveAnswer("");
    setCalmAnswer("");
    setQuestionReason("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">面试背景</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="面试类型" name="interviewType" value={interviewType} onChange={setInterviewType} placeholder="夏令营 / 预推免 / 九推 / 导师组面试" required />
          <FormField label="目标方向" name="targetDirection" value={targetDirection} onChange={setTargetDirection} placeholder="如：人工智能 / NLP" required />
          <FormField label="目标院校" name="targetSchool" value={targetSchool} onChange={setTargetSchool} placeholder="目标院校、学院或实验室" optional />
        </div>
        <FormField
          label="背景材料"
          name="backgroundMaterials"
          value={backgroundMaterials}
          onChange={setBackgroundMaterials}
          placeholder="填写简历、科研经历、项目经历、个人陈述等..."
          type="textarea"
          rows={5}
          required
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">面试问题</h2>
          <button
            type="button"
            onClick={handleGenerateQuestion}
            disabled={!canGenerateQuestion}
            className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingQuestion ? "生成中..." : "AI 生成练习问题"}
          </button>
        </div>
        {questionReason && (
          <p className="mb-2 text-xs text-gray-400">建议原因：{questionReason}</p>
        )}
        <FormField
          label=""
          name="question"
          value={question}
          onChange={setQuestion}
          placeholder="输入面试问题，或点击上方按钮生成"
          type="textarea"
          rows={2}
          required
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-orange-700">临场回答</h2>
          <p className="mb-3 text-xs text-gray-400">
            模拟面试中的限时状态，写下你紧张时会说出的回答。提交后不再修改。
          </p>
          <FormField
            label=""
            name="liveAnswer"
            value={liveAnswer}
            onChange={setLiveAnswer}
            placeholder="写出你在面试中紧张时的回答..."
            type="textarea"
            rows={5}
            required
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-green-700">冷静回答</h2>
          <p className="mb-3 text-xs text-gray-400">
            冷静思考后，重新组织你的回答。试试能否补充临场时遗漏的关键内容。
          </p>
          <FormField
            label=""
            name="calmAnswer"
            value={calmAnswer}
            onChange={setCalmAnswer}
            placeholder="写出你冷静后想到的回答..."
            type="textarea"
            rows={5}
            required
          />
        </div>
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
