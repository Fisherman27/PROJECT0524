"use client";

import { ProfessorPressureTest } from "@/types/replay";

const supportLabel: Record<ProfessorPressureTest["currentSupportLevel"], string> = {
  strong: "强",
  medium: "中",
  weak: "弱",
};

export function ProfessorPressureTestList({ tests }: { tests: ProfessorPressureTest[] }) {
  if (tests.length === 0) {
    return <p className="text-xs text-gray-400">本次未发现明显追问压力点。</p>;
  }

  return (
    <div className="space-y-3">
      {tests.map((test, index) => (
        <div key={index} className="rounded-lg border border-rose-100 bg-rose-50/50 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-rose-900">{test.riskyExpression || "潜在风险表述"}</p>
            <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-rose-600">
              承接能力：{supportLabel[test.currentSupportLevel]}
            </span>
          </div>
          <p className="mt-2 text-rose-800">追问：{test.likelyQuestion || "可能被继续追问细节"}</p>
          {test.dangerReason && <p className="mt-1 text-rose-700">危险原因：{test.dangerReason}</p>}
          {test.safeResponse && (
            <div className="mt-2 rounded border border-emerald-100 bg-emerald-50 p-2 text-emerald-800">
              安全回应：{test.safeResponse}
            </div>
          )}
          {test.missingInfo.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              需要补充：{test.missingInfo.map((item) => item.field).join("、")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
