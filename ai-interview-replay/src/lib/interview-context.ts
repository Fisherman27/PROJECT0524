"use client";

import { useState, useCallback, useEffect } from "react";

export interface InterviewContextData {
  interviewType: string;
  targetDirection: string;
  targetSchool: string;
  backgroundMaterials: string;
}

export type ContextFile = {
  id: string;
  label: string;
  fileName: string;
  content: string;
};

const STORAGE_KEY = "interview-replay-context";
const FILES_KEY = "interview-replay-files";

const defaultContext: InterviewContextData = {
  interviewType: "",
  targetDirection: "",
  targetSchool: "",
  backgroundMaterials: "",
};

function loadFromStorage(): InterviewContextData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultContext, ...JSON.parse(raw) };
  } catch { void 0; }
  return defaultContext;
}

function saveToStorage(data: InterviewContextData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { void 0; }
}

function loadFiles(): ContextFile[] {
  try {
    const raw = localStorage.getItem(FILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFiles(files: ContextFile[]) {
  try { localStorage.setItem(FILES_KEY, JSON.stringify(files)); } catch { void 0; }
}

/** Build the full backgroundMaterials string combining textarea + labelled files */
export function buildFullMaterials(text: string, files: ContextFile[]): string {
  const parts = [text];
  for (const f of files) {
    const label = f.label ? `【${f.label}】` : "【材料文件】";
    parts.push(`\n---\n${label}（${f.fileName}）\n${f.content}`);
  }
  return parts.filter(Boolean).join("\n").trim();
}

export function useInterviewContext() {
  const [data, setData] = useState<InterviewContextData>(defaultContext);
  const [files, setFiles] = useState<ContextFile[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setData(loadFromStorage());
    setFiles(loadFiles());
    setMounted(true);
  }, []);

  const update = useCallback((partial: Partial<InterviewContextData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(next);
      return next;
    });
  }, []);

  const addFile = useCallback((file: ContextFile) => {
    setFiles((prev) => {
      const next = [...prev, file];
      saveFiles(next);
      return next;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      saveFiles(next);
      return next;
    });
  }, []);

  const updateFileLabel = useCallback((id: string, label: string) => {
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, label } : f));
      saveFiles(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setData(defaultContext);
    setFiles([]);
    saveToStorage(defaultContext);
    saveFiles([]);
  }, []);

  const fullMaterials = buildFullMaterials(data.backgroundMaterials, files);

  return { data, files, fullMaterials, update, addFile, removeFile, updateFileLabel, clear, mounted };
}
