"use client";

import { MaterialRecall } from "@/types/replay";

export function MaterialRecallPanel({ recall }: { recall: MaterialRecall }) {
  if (!recall || recall.expectedCount === 0) {
    return <p className="text-xs text-gray-400">本次无材料召回参考</p>;
  }
  const pct = recall.expectedCount > 0 ? Math.round((recall.usedCount / recall.expectedCount) * 100) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>材料召回率</span>
            <span className="font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${pct >= 60 ? "bg-green-500" : pct >= 30 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          使用 {recall.usedCount}/{recall.expectedCount}
        </span>
      </div>
      {recall.recallSummary && <p className="text-sm text-gray-700">{recall.recallSummary}</p>}
      {recall.missingEvidence.length > 0 && (
        <div>
          <p className="text-xs font-medium text-red-600">遗漏证据：</p>
          <ul className="mt-1 space-y-1">
            {recall.missingEvidence.map((e, i) => (
              <li key={i} className="text-xs text-red-500">{e}</li>
            ))}
          </ul>
        </div>
      )}
      {recall.improvementHint && (
        <p className="rounded-lg bg-blue-50 p-2 text-xs text-blue-700">{recall.improvementHint}</p>
      )}
    </div>
  );
}
