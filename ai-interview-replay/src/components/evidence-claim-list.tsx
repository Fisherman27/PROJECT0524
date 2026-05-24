"use client";

import { DiagnosisClaim } from "@/types/replay";

const confidenceLabel: Record<DiagnosisClaim["confidence"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function EvidenceClaimList({ claims }: { claims: DiagnosisClaim[] }) {
  if (claims.length === 0) {
    return <p className="text-xs text-gray-400">本次没有可引用的材料依据，建议补充项目经历或个人贡献边界。</p>;
  }

  return (
    <div className="space-y-3">
      {claims.map((claim, index) => (
        <div key={index} className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-indigo-900">{claim.title}</p>
            <span className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-600">
              置信度：{confidenceLabel[claim.confidence]}
            </span>
          </div>
          {claim.detail && <p className="mt-1 text-indigo-800">{claim.detail}</p>}
          {claim.evidenceRefs.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-indigo-500">依据</p>
              <ul className="mt-1 space-y-1 text-xs text-indigo-700">
                {claim.evidenceRefs.map((ref, refIndex) => (
                  <li key={refIndex}>
                    {ref.evidenceCardTitle}
                    {ref.reason ? `：${ref.reason}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {claim.missingInfo.length > 0 && (
            <div className="mt-2 rounded border border-amber-100 bg-amber-50 p-2">
              <p className="text-xs font-medium text-amber-700">信息缺口</p>
              <ul className="mt-1 space-y-1 text-xs text-amber-700">
                {claim.missingInfo.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    {item.field}：{item.howToSupplement || item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
