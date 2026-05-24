"use client";

import { RiskRadarItem } from "@/types/replay";

const levelBar: Record<string, string> = { "低": "bg-green-500", "中": "bg-yellow-500", "高": "bg-red-500" };

export function RiskRadarPanel({ items }: { items: RiskRadarItem[] }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">本次未检测到明显风险</p>;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-gray-100 bg-white p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{item.dimension}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${levelBar[item.level] || "bg-gray-400"}`}>
              {item.level}
            </span>
          </div>
          <p className="text-xs text-gray-500">{item.reason}</p>
          <p className="mt-1 text-xs text-blue-600">建议：{item.action}</p>
        </div>
      ))}
    </div>
  );
}
