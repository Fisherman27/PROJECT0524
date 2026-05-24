"use client";

import { PostReplayReport } from "@/types/replay";
import { ReportSection } from "@/components/report-section";
import { CopyButton } from "@/components/copy-button";

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
        <CopyButton text={copyText} />
      </div>

      <ReportSection title="问题真实意图" icon="">
        {report.questionIntent && <p className="text-sm text-gray-700">{report.questionIntent}</p>}
      </ReportSection>

      <ReportSection title="回答综合排名" icon="">
        {report.answerRanking.length > 0 ? (
          <ol className="space-y-2">
            {report.answerRanking
              .sort((a, b) => a.rank - b.rank)
              .map((item, i) => (
                <li key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {item.rank}
                  </span>
                  <div className="text-sm">
                    <span className="font-medium text-gray-800">{item.label}</span>
                    <span className="ml-2 text-gray-500">{item.reason}</span>
                  </div>
                </li>
              ))}
          </ol>
        ) : (
          <p className="text-xs text-gray-400">暂无排名</p>
        )}
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
        ) : (
          <p className="text-xs text-gray-400">暂无分析</p>
        )}
      </ReportSection>

      <ReportSection title="逐句诊断" icon="">
        {report.sentenceDiagnosis.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium text-gray-500">
                  <th className="pb-2 pr-3">原句</th>
                  <th className="pb-2 pr-3">诊断</th>
                  <th className="pb-2">建议</th>
                </tr>
              </thead>
              <tbody>
                {report.sentenceDiagnosis.map((d, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-3 text-orange-700">{d.original}</td>
                    <td className="py-2 pr-3 text-red-700">{d.diagnosis}</td>
                    <td className="py-2 text-green-700">{d.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-400">暂无逐句诊断</p>
        )}
      </ReportSection>

      <ReportSection title="空泛表达与过度包装风险" icon="">
        <RiskList items={report.vagueAndOverpackagingRisks} />
      </ReportSection>

      <ReportSection title="导师可能追问" icon="">
        <RiskList items={report.followUpRisks} />
      </ReportSection>

      <ReportSection title="最佳融合回答" icon="">
        {report.bestMergedAnswer && (
          <div className="rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
            {report.bestMergedAnswer}
          </div>
        )}
      </ReportSection>

      <ReportSection title="可迁移回答公式" icon="">
        {report.transferableFormula && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap border border-dashed border-gray-300">
            {report.transferableFormula}
          </div>
        )}
      </ReportSection>

      <ReportSection title="下一场面试准备清单" icon="">
        {report.nextInterviewChecklist.length > 0 ? (
          <ul className="space-y-1">
            {report.nextInterviewChecklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-blue-500">✓</span> {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">暂无准备清单</p>
        )}
      </ReportSection>
    </div>
  );
}
