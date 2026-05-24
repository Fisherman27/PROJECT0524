"use client";

import { AnswerVerification } from "@/types/replay";

const severityStyle: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export function AnswerVerificationPanel({ verification }: { verification: AnswerVerification }) {
  return (
    <div className={`rounded-lg border p-3 text-sm ${
      verification.passed ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`font-medium ${verification.passed ? "text-emerald-800" : "text-amber-800"}`}>
          {verification.passed ? "安全校验通过" : "安全校验提示"}
        </p>
        <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${
          verification.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}>
          {verification.issues.length} 条提示
        </span>
      </div>
      {verification.summary && <p className="mt-1 text-gray-700">{verification.summary}</p>}
      {verification.issues.length > 0 && (
        <ul className="mt-3 space-y-2">
          {verification.issues.map((issue, index) => (
            <li key={index} className="rounded border border-white/70 bg-white/70 p-2">
              <div className="flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${severityStyle[issue.severity]}`}>
                  {issue.severity}
                </span>
                <span className="text-xs font-medium text-gray-700">{issue.issueType}</span>
              </div>
              {issue.originalText && <p className="mt-1 text-xs text-gray-500">原文：{issue.originalText}</p>}
              <p className="mt-1 text-xs text-gray-700">原因：{issue.reason}</p>
              {issue.suggestedFix && <p className="mt-1 text-xs text-emerald-700">建议：{issue.suggestedFix}</p>}
            </li>
          ))}
        </ul>
      )}
      {verification.revisedAnswer && (
        <div className="mt-3 rounded border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900 whitespace-pre-wrap">
          <p className="mb-1 text-xs font-semibold text-blue-600">已采用安全修正版</p>
          {verification.revisedAnswer}
        </div>
      )}
    </div>
  );
}
