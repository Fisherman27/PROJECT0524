"use client";

import { PostReplayReport, QualitySummary, AnswerMaturity } from "@/types/replay";
import { ReportSection } from "@/components/report-section";
import { CopyButton } from "@/components/copy-button";
import { MarkdownExportButton } from "@/components/markdown-export-button";
import { EvidenceCardList } from "@/components/evidence-card-list";
import { MaterialRecallPanel } from "@/components/material-recall-panel";
import { RiskRadarPanel } from "@/components/risk-radar-panel";
import { AuthenticityWarningList } from "@/components/authenticity-warning-list";
import { ReplayCardPanel } from "@/components/replay-card-panel";
import { AgentTracePanel } from "@/components/agent-trace-panel";
import { EvidenceClaimList } from "@/components/evidence-claim-list";
import { ProfessorPressureTestList } from "@/components/professor-pressure-test-list";
import { SafeAnswerPanel } from "@/components/safe-answer-panel";
import { AnswerVerificationPanel } from "@/components/answer-verification-panel";
import { formatPostMarkdown } from "@/lib/markdown-export";
import { safeFilename } from "@/lib/filename";

interface PostReplayResultProps {
  report: PostReplayReport;
  copyText: string;
}

const MATURITY_COLORS: Record<string, string> = {
  L1: "bg-gray-200 text-gray-700",
  L2: "bg-blue-100 text-blue-700",
  L3: "bg-green-100 text-green-700",
  L4: "bg-indigo-100 text-indigo-700",
  L5: "bg-purple-100 text-purple-700",
};

function QualitySummaryCard({ summary, maturity }: { summary: QualitySummary; maturity?: AnswerMaturity }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-gray-800 leading-relaxed">{summary.oneSentenceDiagnosis}</p>
        {maturity && (
          <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${MATURITY_COLORS[maturity.level] || "bg-gray-100 text-gray-600"}`}>
            {maturity.level} {maturity.label}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1"><span className="font-medium text-gray-700">材料召回：</span>{summary.evidenceRecallText}</div>
        <div className="flex items-center gap-1"><span className="font-medium text-gray-700">安全校验：</span>
          <span className={summary.answerSafety === "passed" ? "text-green-600" : summary.answerSafety === "needs_fix" ? "text-amber-600" : "text-gray-400"}>
            {summary.answerSafety === "passed" ? "通过" : summary.answerSafety === "needs_fix" ? "已修正" : "未检查"}
          </span>
        </div>
        <div className="flex items-center gap-1"><span className="font-medium text-gray-700">最大风险：</span><span className="text-amber-700">{summary.topRisk}</span></div>
      </div>
      {summary.conflictNotes.length > 0 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
          <p className="font-medium">冲突说明：</p>
          {summary.conflictNotes.map((note, i) => <p key={i}>- {note}</p>)}
        </div>
      )}
    </div>
  );
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

export function PostReplayResult({ report, copyText }: PostReplayResultProps) {  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">复盘报告</h2>
        <div className="flex items-center gap-2">
          <CopyButton text={copyText} />
          <MarkdownExportButton markdown={formatPostMarkdown(report)} filename={safeFilename("interview-replay-post", ".md")} />
        </div>
      </div>

      {/* Always visible: Quality Summary */}
      <QualitySummaryCard summary={report.qualitySummary} maturity={report.answerMaturity} />

      {/* Always visible: Safe Answer */}
      <ReportSection title="最佳安全回答" icon="">
        <SafeAnswerPanel answer={report.safeAnswer} />
      </ReportSection>

      {/* Group: 风险诊断 */}
      <ReportSection
        title="风险诊断"
        icon=""
        collapsible
        defaultOpen
      >
        <div className="space-y-4">
          <ReportSection title="导师压力测试" icon="" collapsible defaultOpen={report.pressureTests.length > 0}>
            <ProfessorPressureTestList tests={report.pressureTests} />
          </ReportSection>
          <ReportSection title="风险雷达" icon="" collapsible defaultOpen={false}>
            <RiskRadarPanel items={report.riskRadar} />
          </ReportSection>
          <ReportSection title="真实性风险" icon="" collapsible defaultOpen={false}>
            <AuthenticityWarningList items={report.authenticityWarnings} />
          </ReportSection>
          <ReportSection title="导师可能追问" icon="" collapsible defaultOpen={false}>
            <RiskList items={report.followUpRisks} />
          </ReportSection>
        </div>
      </ReportSection>

      {/* Group: 版本对比 */}
      <ReportSection
        title="版本对比"
        icon=""
        collapsible
        defaultOpen
      >
        <div className="space-y-4">
          <ReportSection title="回答综合排名" icon="" collapsible defaultOpen={report.answerRanking.length > 0}>
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
          <ReportSection title="版本差异诊断" icon="" collapsible defaultOpen={false}>
            <EvidenceClaimList claims={report.versionClaims} />
          </ReportSection>
          <ReportSection title="各版本优缺点" icon="" collapsible defaultOpen={false}>
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
          <ReportSection title="逐句诊断" icon="" collapsible defaultOpen={false}>
            {report.sentenceDiagnosis.length > 0 ? (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500"><th className="pb-2 pr-3">原句</th><th className="pb-2 pr-3">诊断</th><th className="pb-2">建议</th></tr></thead>
                <tbody>{report.sentenceDiagnosis.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100"><td className="py-2 pr-3 text-orange-700">{d.original}</td><td className="py-2 pr-3 text-red-700">{d.diagnosis}</td><td className="py-2 text-green-700">{d.suggestion}</td></tr>
                ))}</tbody>
              </table></div>
            ) : <p className="text-xs text-gray-400">暂无逐句诊断</p>}
          </ReportSection>
        </div>
      </ReportSection>

      {/* Group: 证据与分析 */}
      <ReportSection
        title="证据与分析"
        icon=""
        collapsible
        defaultOpen={false}
      >
        <div className="space-y-4">
          <ReportSection title="材料召回率" icon="" collapsible defaultOpen>
            <MaterialRecallPanel recall={report.materialRecall} />
          </ReportSection>
          <ReportSection title="证据依据" icon="" collapsible defaultOpen={false}>
            <EvidenceClaimList claims={report.evidenceClaims} />
          </ReportSection>
        </div>
      </ReportSection>

      {/* Group: 训练与复盘 */}
      <ReportSection
        title="训练与复盘"
        icon=""
        collapsible
        defaultOpen
      >
        <div className="space-y-4">
          {report.answerMaturity && (
            <ReportSection title="当前可训练层级" icon="" collapsible defaultOpen>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2 text-sm">
                <p className="text-gray-600">{report.answerMaturity.level} — {report.answerMaturity.label}</p>
                <p className="text-gray-500">{report.answerMaturity.reason}</p>
                <p className="text-blue-600 font-medium">升级方向：{report.answerMaturity.nextUpgrade}</p>
              </div>
            </ReportSection>
          )}
          <ReportSection title="可迁移回答公式" icon="" collapsible defaultOpen>
            {report.transferableFormula ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{report.transferableFormula}</div>
            ) : <p className="text-xs text-gray-400">未生成</p>}
          </ReportSection>
          <ReportSection title="复盘卡片" icon="" collapsible defaultOpen={false}>
            <ReplayCardPanel card={report.replayCard} />
          </ReportSection>
        </div>
      </ReportSection>

      {/* Group: 技术详情 */}
      <ReportSection
        title="技术详情"
        icon=""
        collapsible
        defaultOpen={false}
      >
        <div className="space-y-4">
          <ReportSection title="问题真实意图" icon="" collapsible defaultOpen={false}>
            {report.questionIntent && <p className="text-sm text-gray-700">{report.questionIntent}</p>}
          </ReportSection>
          <ReportSection title="回答安全校验" icon="" collapsible defaultOpen={false}>
            <AnswerVerificationPanel verification={report.answerVerification} />
          </ReportSection>
          <ReportSection title="材料证据库" icon="" collapsible defaultOpen={false}>
            <EvidenceCardList cards={report.evidenceCards} />
          </ReportSection>
          <ReportSection title="多角色诊断链" icon="" collapsible defaultOpen={false}>
            <AgentTracePanel traces={report.agentTrace} />
          </ReportSection>
        </div>
      </ReportSection>
    </div>
  );
}
