"use client";

import { AuthenticityWarning } from "@/types/replay";

export function AuthenticityWarningList({ items }: { items: AuthenticityWarning[] }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">本次未发现真实性风险</p>;
  return (
    <ul className="space-y-2">
      {items.map((w, i) => (
        <li key={i} className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm">
          <p className="font-medium text-yellow-800">{w.riskType}</p>
          <p className="mt-1 text-yellow-700">
            原文：<span className="line-through">{w.expression}</span>
          </p>
          <p className="mt-1 text-yellow-600">原因：{w.reason}</p>
          <p className="mt-1 text-green-700">
            建议：<span className="font-medium">{w.saferAlternative}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
