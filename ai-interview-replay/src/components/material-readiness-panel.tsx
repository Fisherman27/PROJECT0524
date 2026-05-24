"use client";

interface MaterialReadinessPanelProps {
  materials: string;
  targetDirection?: string;
}

interface ReadinessItem {
  label: string;
  check: boolean;
}

function checkReadiness(materials: string, targetDirection?: string): ReadinessItem[] {
  const text = materials.toLowerCase();
  return [
    {
      label: "材料长度充足（≥200 字）",
      check: materials.trim().length >= 200,
    },
    {
      label: "包含项目或科研关键词",
      check: /项目|系统|平台|实验|模型|算法|竞赛|论文|课题|科研/.test(text),
    },
    {
      label: "包含个人贡献说明",
      check: /负责|实现|设计|优化|完成|构建|开发|贡献|主导|参与/.test(text),
    },
    {
      label: "包含目标方向",
      check: targetDirection ? materials.includes(targetDirection) || /方向|研究|领域/.test(text) : true,
    },
    {
      label: "包含量化结果或具体方法",
      check: /提升|准确率|效率|指标|论文|奖项|\%|\d+%/.test(text),
    },
  ];
}

export function MaterialReadinessPanel({ materials, targetDirection }: MaterialReadinessPanelProps) {
  if (!materials.trim()) return null;

  const items = checkReadiness(materials, targetDirection);

  return (
    <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3">
      <p className="mb-2 text-xs font-medium text-gray-500">材料准备提示</p>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className={item.check ? "text-green-500" : "text-amber-400"}>
              {item.check ? "✓" : "○"}
            </span>
            <span className={item.check ? "text-green-700" : "text-amber-600"}>
              {item.check ? "已覆盖" : "建议补充"}: {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
