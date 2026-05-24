"use client";

import { SafeAnswerOutput } from "@/types/replay";

export function SafeAnswerPanel({ answer }: { answer: SafeAnswerOutput }) {
  if (!answer.answer30s && !answer.answer60s) {
    return <p className="text-xs text-gray-400">安全回答暂未生成。</p>;
  }

  return (
    <div className="space-y-3">
      {answer.answer60s && (
        <div className="rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
          <p className="mb-2 text-xs font-semibold text-blue-600">60 秒安全回答</p>
          {answer.answer60s}
        </div>
      )}
      {answer.answer30s && (
        <div className="rounded-lg border border-blue-100 bg-white p-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
          <p className="mb-2 text-xs font-semibold text-blue-500">30 秒压缩版</p>
          {answer.answer30s}
        </div>
      )}
      {answer.usedEvidence.length > 0 && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
          <p className="text-xs font-semibold text-indigo-600">使用证据</p>
          <ul className="mt-1 space-y-1 text-xs text-indigo-700">
            {answer.usedEvidence.map((ref, index) => (
              <li key={index}>{ref.evidenceCardTitle}{ref.reason ? `：${ref.reason}` : ""}</li>
            ))}
          </ul>
        </div>
      )}
      {answer.riskControls.length > 0 && (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700">风险控制</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-emerald-700">
            {answer.riskControls.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
