"use client";

import { ReplayCard } from "@/types/replay";

export function ReplayCardPanel({ card }: { card: ReplayCard }) {
  return (
    <div className="rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">复盘卡片</span>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">最大问题：</span>
          <span className="text-gray-600">{card.biggestProblem}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">关键改进：</span>
          <span className="text-gray-600">{card.keyImprovement}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">回答公式：</span>
          <span className="rounded bg-white px-2 py-0.5 text-xs font-mono text-blue-700">{card.nextFormula}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">救场句：</span>
          <span className="italic text-gray-500">{card.rescueSentence}</span>
        </div>
        <div>
          <span className="font-medium text-gray-700">下一题：</span>
          <span className="text-gray-600">{card.nextQuestion}</span>
        </div>
      </div>
    </div>
  );
}
