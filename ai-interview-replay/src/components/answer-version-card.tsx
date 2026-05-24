"use client";

import { AnswerVersionDraft } from "@/features/post-replay/use-answer-versions";

interface AnswerVersionCardProps {
  version: AnswerVersionDraft;
  canRemove: boolean;
  onContentChange: (content: string) => void;
  onSourceChange: (source: string) => void;
  onRemove: () => void;
}

export function AnswerVersionCard({
  version,
  canRemove,
  onContentChange,
  onSourceChange,
  onRemove,
}: AnswerVersionCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
          回答 {version.label}
        </span>
        <input
          type="text"
          value={version.source}
          onChange={(e) => onSourceChange(e.target.value)}
          placeholder="来源"
          className="w-40 rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 focus:border-blue-400 focus:outline-none"
        />
        <div className="flex-1" />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-xs text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            title="删除此版本"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <textarea
        value={version.content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder={`输入${version.source}...`}
        rows={4}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}
