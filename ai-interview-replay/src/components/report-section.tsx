"use client";

interface ReportSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
}

export function ReportSection({ title, icon, children, emptyText = "本次未发现明显问题", isEmpty = false }: ReportSectionProps) {
  if (isEmpty && !children) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <h3 className="mb-1 text-sm font-semibold text-gray-400">
          {icon} {title}
        </h3>
        <p className="text-xs text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-800">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}
