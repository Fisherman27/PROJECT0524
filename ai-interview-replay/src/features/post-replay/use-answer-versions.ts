"use client";

import { useState, useCallback } from "react";

export type AnswerVersionDraft = {
  id: string;
  label: string;
  source: string;
  content: string;
};

let nextId = 0;
function uid(): string {
  return `av_${++nextId}_${Date.now()}`;
}

const defaultVersions: AnswerVersionDraft[] = [
  { id: uid(), label: "A", source: "真实回答", content: "" },
  { id: uid(), label: "B", source: "事后想到", content: "" },
  { id: uid(), label: "C", source: "同学/学长/AI建议", content: "" },
];

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function useAnswerVersions() {
  const [versions, setVersions] = useState<AnswerVersionDraft[]>(defaultVersions);

  const updateContent = useCallback((id: string, content: string) => {
    setVersions((prev) =>
      prev.map((v) => (v.id === id ? { ...v, content } : v))
    );
  }, []);

  const updateSource = useCallback((id: string, source: string) => {
    setVersions((prev) =>
      prev.map((v) => (v.id === id ? { ...v, source } : v))
    );
  }, []);

  const addVersion = useCallback(() => {
    setVersions((prev) => {
      if (prev.length >= 6) return prev;
      const nextLabel = LABELS[prev.length] || String(prev.length + 1);
      return [
        ...prev,
        { id: uid(), label: nextLabel, source: "其他", content: "" },
      ];
    });
  }, []);

  const removeVersion = useCallback((id: string) => {
    setVersions((prev) => {
      if (prev.length <= 2) return prev;
      const rest = prev.filter((v) => v.id !== id);
      return rest.map((v, i) => ({ ...v, label: LABELS[i] || String(i + 1) }));
    });
  }, []);

  const reset = useCallback(() => {
    setVersions(
      defaultVersions.map((v) => ({ ...v, id: uid() }))
    );
  }, []);

  const validCount = versions.filter((v) => v.content.trim()).length;

  return {
    versions,
    validCount,
    updateContent,
    updateSource,
    addVersion,
    removeVersion,
    reset,
  };
}
