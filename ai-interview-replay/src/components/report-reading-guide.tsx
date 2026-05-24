"use client";

interface ReportReadingGuideProps {
  mode: "pre" | "post";
}

export function ReportReadingGuide({ mode }: ReportReadingGuideProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-700">
      <span className="mr-1 select-none">&#9432;</span>
      {mode === "pre" ? (
        <span>建议先看质量摘要和最佳安全回答，再看临场损失、材料召回和导师压力测试。</span>
      ) : (
        <span>建议先看质量摘要、回答排名和最佳安全回答，再看版本差异、材料召回和风险项。</span>
      )}
      <span className="mt-1 block text-blue-500">
        本报告由材料分析、问题意图、证据匹配、风险、回答融合和安全校验等角色共同生成。
      </span>
    </div>
  );
}
