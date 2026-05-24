"use client";

import { PreReplayReport } from "@/types/replay";
import { ReportSection } from "@/components/report-section";
import { CopyButton } from "@/components/copy-button";
import { MarkdownExportButton } from "@/components/markdown-export-button";
import { EvidenceCardList } from "@/components/evidence-card-list";
import { MaterialRecallPanel } from "@/components/material-recall-panel";
import { RiskRadarPanel } from "@/components/risk-radar-panel";
import { AuthenticityWarningList } from "@/components/authenticity-warning-list";
import { ReplayCardPanel } from "@/components/replay-card-panel";
import { AgentTracePanel } from "@/components/agent-trace-panel";
import { formatPreMarkdown } from "@/lib/markdown-export";
import { safeFilename } from "@/lib/filename";

interface PreReplayResultProps {
  report: PreReplayReport;
  copyText: string;
}

function BulletList({ items, type }: { items: Array<{ title: string; detail: string }>; type: "diagnosis" | "improvement" }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">本次未发现明显问题</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${type === "diagnosis" ? "bg-orange-400" : "bg-green-400"}`} />
          <div>
            <span className="font-medium text-gray-700">{item.title}：</span>
            <span className="text-gray-600">{item.detail}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RiskList({ items }: { items: Array<{ risk: string; reason: string; suggestedPreparation: string }> }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">本次未发现明显追问风险</p>;
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm">
          <p className="font-medium text-yellow-800">追问：{item.risk}</p>
          <p className="mt-1 text-yellow-700">原因：{item.reason}</p>
          <p className="mt-1 text-yellow-600">准备：{item.suggestedPreparation}</p>
        </li>
      ))}
    </ul>
  );
}

export function PreReplayResult({ report, copyText }: PreReplayResultProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">复盘报告</h2>
        <div className="flex items-center gap-2">
          <CopyButton text={copyText} />
          <MarkdownExportButton markdown={formatPreMarkdown(report)} filename={safeFilename("interview-replay-pre", ".md")} />
        </div>
      </div>

      <ReportSection title="问题真实意图" icon="">{report.questionIntent && <p className="text-sm text-gray-700">{report.questionIntent}</p>}</ReportSection>

      <ReportSection title="材料证据库" icon=""><EvidenceCardList cards={report.evidenceCards} /></ReportSection>

      <ReportSection title="材料召回率" icon=""><MaterialRecallPanel recall={report.materialRecall} /></ReportSection>

      <ReportSection title="临场回答诊断" icon=""><BulletList items={report.liveAnswerDiagnosis} type="diagnosis" /></ReportSection>

      <ReportSection title="临场损失分析" icon=""><BulletList items={report.liveLossAnalysis} type="diagnosis" /></ReportSection>

      <ReportSection title="风险雷达" icon=""><RiskRadarPanel items={report.riskRadar} /></ReportSection>

      <ReportSection title="真实性风险" icon=""><AuthenticityWarningList items={report.authenticityWarnings} /></ReportSection>

      <ReportSection title="导师追问风险" icon=""><RiskList items={report.followUpRisks} /></ReportSection>

      <ReportSection title="最佳融合回答" icon="">
        {report.bestMergedAnswer && <div className="rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{report.bestMergedAnswer}</div>}
      </ReportSection>

      <ReportSection title="下次救场模板" icon="">
        {report.rescueTemplate && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{report.rescueTemplate}</div>}
      </ReportSection>

      <ReportSection title="复盘卡片" icon=""><ReplayCardPanel card={report.replayCard} /></ReportSection>

      <ReportSection title="多角色诊断链" icon=""><AgentTracePanel traces={report.agentTrace} /></ReportSection>
    </div>
  );
}
