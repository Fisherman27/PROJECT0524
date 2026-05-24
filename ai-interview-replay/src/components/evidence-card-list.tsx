"use client";

import { EvidenceCard } from "@/types/replay";

export function EvidenceCardList({ cards }: { cards: EvidenceCard[] }) {
  if (cards.length === 0) return <p className="text-xs text-gray-400">本次未提取到可用证据卡</p>;
  const colors: Record<string, string> = {
    project: "bg-blue-50 text-blue-700 border-blue-200",
    research: "bg-purple-50 text-purple-700 border-purple-200",
    course: "bg-green-50 text-green-700 border-green-200",
    competition: "bg-orange-50 text-orange-700 border-orange-200",
    statement: "bg-teal-50 text-teal-700 border-teal-200",
    other: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <div className="space-y-3">
      {cards.map((card, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">{card.title}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${colors[card.type] || colors.other}`}>
              {card.type}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-600">{card.content}</p>
          {card.abilities.length > 0 && (
            <p className="text-xs text-gray-500">能力：{card.abilities.join(" · ")}</p>
          )}
          {card.possibleFollowUps.length > 0 && (
            <p className="mt-1 text-xs text-yellow-600">追问：{card.possibleFollowUps.join("；")}</p>
          )}
          {card.usageRisk && (
            <p className="mt-1 text-xs text-red-500">风险：{card.usageRisk}</p>
          )}
        </div>
      ))}
    </div>
  );
}
