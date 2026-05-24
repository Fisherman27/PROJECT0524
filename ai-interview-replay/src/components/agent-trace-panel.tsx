"use client";

import { AgentTraceItem } from "@/types/replay";

const stageLabel: Record<string, string> = {
  material: "材料阶段",
  question: "问题阶段",
  diagnosis: "诊断阶段",
  synthesis: "生成阶段",
  training: "训练阶段",
  compose: "汇总阶段",
};

export function AgentTracePanel({ traces }: { traces: AgentTraceItem[] }) {
  if (traces.length === 0) return null;

  // Group by stage
  const stages = new Map<string, AgentTraceItem[]>();
  for (const t of traces) {
    const key = t.stage || "other";
    if (!stages.has(key)) stages.set(key, []);
    stages.get(key)!.push(t);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">多角色诊断链</p>
      <div className="space-y-2">
        {Array.from(stages.entries()).map(([stage, items]) => (
          <div key={stage} className="space-y-1">
            {stage !== "other" && (
              <p className="text-xs font-medium text-gray-500">{stageLabel[stage] || stage}</p>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <span
                    className={`h-2 w-2 flex-shrink-0 rounded-full ${
                      t.status === "success" ? "bg-green-400"
                        : t.status === "skipped" ? "bg-gray-300"
                        : "bg-red-400"
                    }`}
                  />
                  <span className="text-xs font-medium text-gray-700">{t.agentName}</span>
                  {t.agentVersion && (
                    <span className="text-xs text-gray-300">{t.agentVersion}</span>
                  )}
                  {t.durationMs != null && (
                    <span className="text-xs text-gray-400">
                      {Math.round(t.durationMs / 1000)}s
                    </span>
                  )}
                  {t.usedCachedInput && (
                    <span className="rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-600">
                      缓存
                    </span>
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
        ))}
      </div>
    </div>
  );
}
