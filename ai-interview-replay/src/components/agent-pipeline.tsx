"use client";

import { useEffect, useState } from "react";
import { AgentTraceItem } from "@/types/replay";

type AgentStatus = "pending" | "running" | "completed" | "failed" | "cached";

interface AgentDef {
  key: string;
  name: string;
  description: string;
  stage: string;
  mode: "pre" | "post" | "both";
}

const AGENT_DEFS: AgentDef[] = [
  { key: "材料分析器", name: "材料分析器", description: "提取可用的个人证据卡", stage: "material", mode: "both" },
  { key: "问题意图分析器", name: "问题意图分析器", description: "判断面试题真实考察目标", stage: "question", mode: "both" },
  { key: "证据规划器", name: "证据规划器", description: "预判本题应调用哪些材料", stage: "question", mode: "both" },
  { key: "材料证据匹配器", name: "材料证据匹配器", description: "计算材料召回率与遗漏", stage: "diagnosis", mode: "both" },
  { key: "导师风险审查员", name: "导师风险审查员", description: "识别追问风险与过度包装", stage: "diagnosis", mode: "both" },
  { key: "临场差距诊断器", name: "临场差距诊断器", description: "诊断临场回答的信息损失", stage: "diagnosis", mode: "pre" },
  { key: "多版本差异诊断器", name: "多版本差异诊断器", description: "比较多个回答版本的优劣", stage: "diagnosis", mode: "post" },
  { key: "回答融合重构器", name: "回答融合重构器", description: "融合各版本生成最佳回答", stage: "synthesis", mode: "both" },
  { key: "训练规划器", name: "训练规划器", description: "生成复盘卡片与训练建议", stage: "training", mode: "both" },
];

const STAGE_ORDER = ["material", "question", "diagnosis", "synthesis", "training"];

function resolveStatus(
  agent: AgentDef,
  traces: AgentTraceItem[] | null,
  currentPhase: string | null,
  animProgress: number,
): AgentStatus {
  if (!traces) {
    // Simulated progress during loading
    if (!currentPhase) return "pending";
    const phaseIdx = STAGE_ORDER.indexOf(currentPhase);
    const agentStageIdx = STAGE_ORDER.indexOf(agent.stage);
    if (agentStageIdx < phaseIdx) return "completed";
    if (agentStageIdx === phaseIdx) return "running";
    return "pending";
  }

  // Real trace data after response
  const match = traces.find((t) => t.agentName.includes(agent.key) || agent.key.includes(t.agentName));
  if (!match) return "pending";
  if (match.status === "failed") return "failed";
  if (match.usedCachedInput) return "cached";
  return "completed";
}

const statusDot: Record<AgentStatus, string> = {
  pending: "bg-gray-200",
  running: "bg-amber-400 animate-pulse",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
  cached: "bg-blue-500",
};

const statusBorder: Record<AgentStatus, string> = {
  pending: "border-gray-100",
  running: "border-amber-300 bg-amber-50/50",
  completed: "border-emerald-200 bg-emerald-50/30",
  failed: "border-red-200 bg-red-50/30",
  cached: "border-blue-200 bg-blue-50/30",
};

const statusLabel: Record<AgentStatus, string> = {
  pending: "待命",
  running: "执行中",
  completed: "完成",
  failed: "失败",
  cached: "缓存",
};

function AgentCard({
  agent,
  status,
  trace,
}: {
  agent: AgentDef;
  status: AgentStatus;
  trace?: AgentTraceItem;
}) {
  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-2.5 py-2 transition-colors duration-500 ${statusBorder[status]}`}>
      <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${statusDot[status]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-700">{agent.name}</span>
          <span className={`rounded px-1 py-px text-[10px] font-medium ${
            status === "completed" ? "bg-emerald-100 text-emerald-700" :
            status === "running" ? "bg-amber-100 text-amber-700" :
            status === "failed" ? "bg-red-100 text-red-700" :
            status === "cached" ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-500"
          }`}>
            {statusLabel[status]}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-tight text-gray-400">{agent.description}</p>
        {trace?.summary && (
          <p className="mt-1 truncate text-[10px] text-gray-400" title={trace.summary}>
            {trace.summary.slice(0, 40)}
          </p>
        )}
        {trace?.durationMs != null && (
          <p className="mt-0.5 text-[10px] text-gray-300">{Math.round(trace.durationMs / 1000)}s</p>
        )}
      </div>
    </div>
  );
}

export interface AgentPipelineProps {
  mode: "pre" | "post";
  traces?: AgentTraceItem[] | null;
  /** If true, auto-advance through simulated phases */
  animating?: boolean;
}

export function AgentPipeline({ mode, traces, animating }: AgentPipelineProps) {
  const [animPhase, setAnimPhase] = useState<number>(0);

  useEffect(() => {
    if (!animating || traces) {
      setAnimPhase(0);
      return;
    }

    // Advance through stages on a timer
    setAnimPhase(0);
    const interval = setInterval(() => {
      setAnimPhase((prev) => {
        const next = prev + 1;
        if (next >= STAGE_ORDER.length) {
          clearInterval(interval);
          return prev;
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [animating, traces]);

  const currentPhase = animating && !traces ? STAGE_ORDER[animPhase] ?? null : null;

  const visibleAgents = AGENT_DEFS.filter((a) => a.mode === mode || a.mode === "both");

  return (
    <div className="space-y-1.5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-xs font-semibold text-gray-500">Agent 诊断链</span>
        {animating && !traces && (
          <span className="text-[10px] text-gray-300">({STAGE_ORDER[animPhase] ?? "准备中"}阶段)</span>
        )}
        {traces && (
          <span className="text-[10px] text-gray-300">({traces.length} 角色已完成)</span>
        )}
      </div>
      {visibleAgents.map((agent) => {
        const status = resolveStatus(agent, traces ?? null, currentPhase, animPhase);
        const trace = traces?.find(
          (t) => t.agentName.includes(agent.key) || agent.key.includes(t.agentName),
        );
        return <AgentCard key={agent.key} agent={agent} status={status} trace={trace} />;
      })}
    </div>
  );
}
