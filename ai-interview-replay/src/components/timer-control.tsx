"use client";

interface TimerControlProps {
  duration: number;
  onDurationChange: (secs: number) => void;
  disabled: boolean;
}

const PRESETS = [30, 60, 90, 120];

export function TimerControl({ duration, onDurationChange, disabled }: TimerControlProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">作答时间：</span>
      <div className="flex gap-1">
        {PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onDurationChange(s)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              duration === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {s}s
          </button>
        ))}
      </div>
    </div>
  );
}
