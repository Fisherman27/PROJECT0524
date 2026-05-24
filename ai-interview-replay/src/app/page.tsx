"use client";

import { ModeCard } from "@/components/mode-card";
import { FormField } from "@/components/form-field";
import { MaterialFileManager } from "@/components/material-file-manager";
import { useInterviewContext } from "@/lib/interview-context";

export default function Home() {
  const { data, files, update, addFile, removeFile, updateFileLabel, clear, mounted } = useInterviewContext();

  const totalChars = (mounted ? data.backgroundMaterials.length : 0) +
    files.reduce((sum, f) => sum + f.content.length, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Interview Replay
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
          保研面试复盘教练 &mdash; 把面试中的模糊后悔转化成具体诊断，
          把一次回答沉淀成下一次可用的表达策略。
        </p>
      </div>

      {/* Interview Background Panel */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">面试背景</h2>
          <button
            onClick={clear}
            className="rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            清空
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          填写你的面试背景信息，将在&ldquo;面试前模拟&rdquo;和&ldquo;面试后复盘&rdquo;中复用
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="面试类型"
            name="interviewType"
            value={data.interviewType}
            onChange={(v) => update({ interviewType: v })}
            placeholder="夏令营 / 预推免 / 导师组面试"
          />
          <FormField
            label="目标方向"
            name="targetDirection"
            value={data.targetDirection}
            onChange={(v) => update({ targetDirection: v })}
            placeholder="如：人工智能 / NLP"
          />
          <FormField
            label="目标院校"
            name="targetSchool"
            value={data.targetSchool}
            onChange={(v) => update({ targetSchool: v })}
            placeholder="院校、学院或实验室"
            optional
          />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">背景材料（文字）</label>
            <span className="text-xs text-gray-400">
              {mounted ? data.backgroundMaterials.length : 0} 字
              {files.length > 0 && ` + ${files.length} 个文件`}
            </span>
          </div>
          <textarea
            value={data.backgroundMaterials}
            onChange={(e) => update({ backgroundMaterials: e.target.value })}
            placeholder="手动填写简历亮点、科研经历、项目经历等..."
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-gray-500">上传材料文件</p>
            <MaterialFileManager
              files={files}
              onAdd={addFile}
              onRemove={removeFile}
              onLabelChange={updateFileLabel}
            />
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-3 text-center text-sm font-medium text-gray-400">选择复盘模式</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ModeCard
            title="面试前模拟"
            subtitle="临场回答 + 冷静回答"
            description="限时回答一道保研问题，比较紧张时和冷静时的回答差距，发现关键信息遗漏。"
            href="/pre"
            labels={["临场差距", "证据遗漏", "救场模板"]}
          />
          <ModeCard
            title="面试后复盘"
            subtitle="多版本回答对比"
            description="输入真实面试问题和多个回答，从导师视角诊断哪种说法更稳。"
            href="/post"
            labels={["版本对比", "逐句诊断", "回答公式"]}
          />
        </div>
      </div>
    </div>
  );
}
