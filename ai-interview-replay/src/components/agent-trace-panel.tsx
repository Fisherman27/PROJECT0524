"use client";

import { AgentTraceItem } from "@/types/replay";

export function AgentTracePanel({ traces }: { traces: AgentTraceItem[] }) {
  if (traces.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400">多角色诊断链</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {traces.map((t, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
          >
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${
                t.status === "success" ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-xs font-medium text-gray-700">{t.agentName}</span>
            {t.durationMs != null && (
              <span className="text-xs text-gray-400">{Math.round(t.durationMs / 1000)}s</span>
            )}
            {t.summary && (
              <span className="min-w-0 flex-1 truncate text-xs text-gray-500" title={t.summary}>
                {t.summary}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
