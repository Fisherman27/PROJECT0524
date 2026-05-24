"use client";

interface UseGuidePanelProps {
  compact?: boolean;
}

const steps = [
  { num: 1, title: "填材料", desc: "简历、项目、科研、竞赛经历都可以" },
  { num: 2, title: "分析材料", desc: "系统提取可复用证据卡，为复盘做基础" },
  { num: 3, title: "选择模式", desc: "面试前练临场表达，面试后复盘真实回答" },
  { num: 4, title: "生成复盘", desc: "查看表达损失、材料召回、风险和训练建议" },
];

export function UseGuidePanel({ compact = false }: UseGuidePanelProps) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <p className="mb-3 text-xs font-semibold text-blue-700">使用流程</p>
      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "sm:grid-cols-4"}`}>
        {steps.map((s) => (
          <div key={s.num} className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
              {s.num}
            </span>
            <div>
              <p className="text-xs font-medium text-gray-700">{s.title}</p>
              <p className="text-xs text-gray-400">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
