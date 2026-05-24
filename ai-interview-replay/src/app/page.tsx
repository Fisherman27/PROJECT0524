"use client";

import { useState, useEffect } from "react";
import { ModeCard } from "@/components/mode-card";
import { FormField } from "@/components/form-field";
import { MaterialFileManager } from "@/components/material-file-manager";
import { AgentPipeline } from "@/components/agent-pipeline";
import { UseGuidePanel } from "@/components/use-guide-panel";
import { MaterialReadinessPanel } from "@/components/material-readiness-panel";
import { useInterviewContext } from "@/lib/interview-context";
import { demoInterviewContext } from "@/lib/demo-data";
import { MaterialPreAnalysis, AgentTraceItem } from "@/types/replay";

export default function Home() {
  const {
    data, files, fullMaterials, update, addFile, removeFile, updateFileLabel, clear, mounted,
    materialAnalysis, setMaterialAnalysis, isMaterialAnalysisStale,
  } = useInterviewContext();

  const [analyzing, setAnalyzing] = useState(false);
  const [materialError, setMaterialError] = useState("");
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    clear();
    setCleared(true);
  }, []);

  const hasMaterials = fullMaterials.trim().length > 0;
  const materialChanged = mounted && materialAnalysis
    ? isMaterialAnalysisStale(fullMaterials, data.targetDirection, data.targetSchool)
    : false;
  const analysisDone = hasMaterials && materialAnalysis && !materialChanged;

  // Build agent trace for homepage sidebar
  const getHomepageTraces = (): AgentTraceItem[] | undefined => {
    if (analyzing) return undefined; // animated mode
    if (materialAnalysis && !materialChanged) {
      return [
        {
          agentName: "材料分析器",
          agentVersion: "v1",
          stage: "material",
          summary: materialAnalysis.summary?.slice(0, 100) || "材料分析完成",
          status: "success",
          usedCachedInput: true,
        },
      ];
    }
    return undefined;
  };

  const handleAnalyzeMaterials = async () => {
    setAnalyzing(true);
    setMaterialError("");
    try {
      const res = await fetch("/api/agents/material", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backgroundMaterials: fullMaterials,
          interviewType: data.interviewType || undefined,
          targetDirection: data.targetDirection || undefined,
          targetSchool: data.targetSchool || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMaterialError(json?.error?.message || "分析失败");
        return;
      }
      setMaterialAnalysis(json as MaterialPreAnalysis, {
        backgroundMaterials: fullMaterials,
        targetDirection: data.targetDirection,
        targetSchool: data.targetSchool,
      });
    } catch (e) {
      setMaterialError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadDemo = () => {
    update(demoInterviewContext);
    setMaterialError("");
  };

  const handleClear = () => {
    clear();
    setMaterialError("");
  };

  const analyzingLabel = analyzing ? "分析中..."
    : analysisDone ? "材料分析已完成"
    : "分析材料";

  const mainContent = (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          Interview Replay
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
          保研面试复盘助理 &mdash; 把面试中的模糊后悔转化成具体诊断，
          把一次回答沉淀成下一次可用的表达策略。
        </p>
      </div>

      {/* Usage guide */}
      <UseGuidePanel />

      {/* Interview Background Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">面试背景</h2>
          <button
            onClick={handleClear}
            className="rounded-lg px-2.5 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            清空
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          填写你的面试背景信息和材料文件，将在&ldquo;面试前模拟&rdquo;和&ldquo;面试后复盘&rdquo;中复用
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="面试类型"
            name="interviewType"
            value={data.interviewType}
            onChange={(v) => update({ interviewType: v })}
            placeholder="夏令营 / 预推免 / 导师组面试"
            optional
          />
          <FormField
            label="目标方向"
            name="targetDirection"
            value={data.targetDirection}
            onChange={(v) => update({ targetDirection: v })}
            placeholder="如：人工智能 / NLP"
            optional
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
            <label className="text-sm font-medium text-gray-700">
              背景材料 <span className="text-xs font-normal text-gray-400">（选填）</span>
            </label>
            <span className="text-xs text-gray-400">
              {mounted ? fullMaterials.length : 0} 字
              {files.length > 0 && ` + ${files.length} 个文件`}
            </span>
          </div>
          <textarea
            value={data.backgroundMaterials}
            onChange={(e) => update({ backgroundMaterials: e.target.value })}
            placeholder="手动填写简历亮点、科研经历、项目经历、目标院校招生要求等（选填）..."
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <MaterialReadinessPanel
            materials={fullMaterials}
            targetDirection={data.targetDirection}
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

          {/* Analyze Material Button */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyzeMaterials}
              disabled={!hasMaterials || analyzing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {analyzingLabel}
            </button>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              载入示例材料
            </button>
            {analysisDone && (
              <span className="text-xs text-green-600">
                检测到 {materialAnalysis!.evidenceCards.length} 张证据卡 &mdash; 已存入上下文
              </span>
            )}
            {materialChanged && (
              <span className="text-xs text-amber-500">材料已变更，可重新分析</span>
            )}
          </div>
          {materialError && (
            <p className="mt-2 text-xs text-red-500">分析失败：{materialError}（可稍后重试，或直接进入复盘模式）</p>
          )}
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <h2 className="mb-3 text-center text-sm font-medium text-gray-400">选择复盘模式</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ModeCard
            title="面试前模拟"
            subtitle="临场回答 + 冷静回答"
            description="限时回答一道保研问题，比较紧张时和冷静时的回答差距，发现关键信息遗漏。"
            href="/pre"
            labels={["临场差距", "证据遗漏", "救场模板"]}
            fitFor="正式面试前，想练真实临场表达"
            needs="一道问题 + 临场回答 + 冷静回答"
          />
          <ModeCard
            title="面试后复盘"
            subtitle="多版本回答对比"
            description="输入真实面试问题和多个回答，从导师视角诊断哪种说法更稳。"
            href="/post"
            labels={["版本对比", "逐句诊断", "回答公式"]}
            fitFor="真实面试后，想比较多个回答版本"
            needs="真实问题 + 至少两个回答版本"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        {mainContent}
      </div>
      {!cleared ? null : (
      /* Agent Pipeline sidebar — always visible from homepage */
      <div className="w-56 flex-shrink-0">
        <div className="sticky top-20">
          <AgentPipeline
            mode="pre"
            showAll
            animating={analyzing}
            maxStage="material"
            traces={getHomepageTraces()}
          />
        </div>
      </div>
      )}
    </div>
  );
}
