"use client";

import { PostReplayReport } from "@/types/replay";
import { ReportSection } from "@/components/report-section";
import { CopyButton } from "@/components/copy-button";
import { MarkdownExportButton } from "@/components/markdown-export-button";
import { EvidenceCardList } from "@/components/evidence-card-list";
import { MaterialRecallPanel } from "@/components/material-recall-panel";
import { RiskRadarPanel } from "@/components/risk-radar-panel";
import { AuthenticityWarningList } from "@/components/authenticity-warning-list";
import { ReplayCardPanel } from "@/components/replay-card-panel";
import { AgentTracePanel } from "@/components/agent-trace-panel";
import { formatPostMarkdown } from "@/lib/markdown-export";
import { safeFilename } from "@/lib/filename";

interface PostReplayResultProps {
  report: PostReplayReport;
  copyText: string;
}

function RiskList({ items }: { items: Array<{ risk: string; reason: string; suggestedPreparation: string }> }) {
  if (items.length === 0) return <p className="text-xs text-gray-400">本次未发现明显风险</p>;
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm">
          <p className="font-medium text-yellow-800">风险：{item.risk}</p>
          <p className="mt-1 text-yellow-700">原因：{item.reason}</p>
          <p className="mt-1 text-yellow-600">准备：{item.suggestedPreparation}</p>
        </li>
      ))}
    </ul>
  );
}

export function PostReplayResult({ report, copyText }: PostReplayResultProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">复盘报告</h2>
        <div className="flex items-center gap-2">
          <CopyButton text={copyText} />
          <MarkdownExportButton markdown={formatPostMarkdown(report)} filename={safeFilename("interview-replay-post", ".md")} />
        </div>
      </div>

      <ReportSection title="问题真实意图" icon="">{report.questionIntent && <p className="text-sm text-gray-700">{report.questionIntent}</p>}</ReportSection>

      <ReportSection title="材料证据库" icon=""><EvidenceCardList cards={report.evidenceCards} /></ReportSection>

      <ReportSection title="材料召回率" icon=""><MaterialRecallPanel recall={report.materialRecall} /></ReportSection>

      <ReportSection title="回答综合排名" icon="">
        {report.answerRanking.length > 0 ? (
          <ol className="space-y-2">
            {report.answerRanking.sort((a, b) => a.rank - b.rank).map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{item.rank}</span>
                <div className="text-sm"><span className="font-medium text-gray-800">{item.label}</span><span className="ml-2 text-gray-500">{item.reason}</span></div>
              </li>
            ))}
          </ol>
        ) : <p className="text-xs text-gray-400">暂无排名</p>}
      </ReportSection>

      <ReportSection title="各版本优缺点" icon="">
        {report.versionReviews.length > 0 ? (
          <div className="space-y-3">
            {report.versionReviews.map((v, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                <p className="mb-2 font-semibold text-gray-700">{v.label}</p>
                <p className="text-green-700">优点：{v.strengths.join("、") || "无"}</p>
                <p className="text-red-700">问题：{v.problems.join("、") || "无"}</p>
                <p className="text-blue-700">保留：{v.keepParts.join("、") || "无"}</p>
                <p className="text-gray-500">避免：{v.avoidParts.join("、") || "无"}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-400">暂无分析</p>}
      </ReportSection>

      <ReportSection title="逐句诊断" icon="">
        {report.sentenceDiagnosis.length > 0 ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500"><th className="pb-2 pr-3">原句</th><th className="pb-2 pr-3">诊断</th><th className="pb-2">建议</th></tr></thead>
            <tbody>{report.sentenceDiagnosis.map((d, i) => (
              <tr key={i} className="border-b border-gray-100"><td className="py-2 pr-3 text-orange-700">{d.original}</td><td className="py-2 pr-3 text-red-700">{d.diagnosis}</td><td className="py-2 text-green-700">{d.suggestion}</td></tr>
            ))}</tbody>
          </table></div>
        ) : <p className="text-xs text-gray-400">暂无逐句诊断</p>}
      </ReportSection>

      <ReportSection title="风险雷达" icon=""><RiskRadarPanel items={report.riskRadar} /></ReportSection>

      <ReportSection title="真实性风险" icon=""><AuthenticityWarningList items={report.authenticityWarnings} /></ReportSection>

      <ReportSection title="导师可能追问" icon=""><RiskList items={report.followUpRisks} /></ReportSection>

      <ReportSection title="最佳融合回答" icon="">
        {report.bestMergedAnswer && <div className="rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{report.bestMergedAnswer}</div>}
      </ReportSection>

      <ReportSection title="可迁移回答公式" icon="">
        {report.transferableFormula && <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{report.transferableFormula}</div>}
      </ReportSection>

      <ReportSection title="复盘卡片" icon=""><ReplayCardPanel card={report.replayCard} /></ReportSection>

      <ReportSection title="多角色诊断链" icon=""><AgentTracePanel traces={report.agentTrace} /></ReportSection>
    </div>
  );
}
