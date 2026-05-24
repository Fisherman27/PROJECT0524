interface LoadingStateProps {
  text?: string;
  steps?: string[];
}

export function LoadingState({ text = "正在分析中...", steps }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="mt-4 text-sm text-gray-500">{text}</p>
      {steps && steps.length > 0 ? (
        <div className="mt-3 space-y-1">
          {steps.map((s, i) => (
            <p key={i} className="text-xs text-gray-400">
              <span className="mr-1.5 text-blue-400">&bull;</span>
              {s}
            </p>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-gray-400">大模型正在处理，请稍候</p>
      )}
    </div>
  );
}
