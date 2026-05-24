"use client";

interface StepItem {
  title: string;
  description: string;
}

interface StepGuideProps {
  steps: StepItem[];
}

export function StepGuide({ steps }: StepGuideProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
      <p className="mb-3 text-xs font-semibold text-gray-500">操作步骤</p>
      <div className="flex flex-wrap gap-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
              {i + 1}
            </span>
            <div>
              <p className="text-xs font-medium text-gray-700">{s.title}</p>
              <p className="text-xs text-gray-400">{s.description}</p>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-1 text-gray-300 select-none">&rarr;</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
