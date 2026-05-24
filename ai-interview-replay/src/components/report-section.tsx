"use client";

import { useState } from "react";

interface ReportSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  emptyText?: string;
  isEmpty?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
  badge?: string;
}

export function ReportSection({
  title,
  icon,
  children,
  emptyText = "本次未发现明显问题",
  isEmpty = false,
  collapsible = false,
  defaultOpen = false,
  badge,
}: ReportSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (isEmpty && !children) {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <h3 className="text-xs font-semibold text-gray-400">
          {icon} {title}
        </h3>
        <p className="mt-1 text-xs text-gray-400">{emptyText}</p>
      </div>
    );
  }

  const header = (
    <button
      type="button"
      className={`flex w-full items-center justify-between gap-2 text-left ${collapsible ? "cursor-pointer" : "cursor-default"}`}
      onClick={() => collapsible && setOpen(!open)}
      disabled={!collapsible}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
        <span className="select-none">{icon}</span>
        <span className="select-none">{title}</span>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-500">{badge}</span>
        )}
      </span>
      {collapsible && (
        <svg
          className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </button>
  );

  if (!collapsible) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {header}
        <div className="mt-3">{children}</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {header}
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
