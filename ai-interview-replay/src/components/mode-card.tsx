"use client";

import Link from "next/link";

interface ModeCardProps {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  labels: string[];
}

export function ModeCard({ title, subtitle, description, href, labels }: ModeCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">{title}</h2>
      <p className="mt-1 text-xs font-medium text-blue-600">{subtitle}</p>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">{description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600"
          >
            {label}
          </span>
        ))}
      </div>
    </Link>
  );
}
