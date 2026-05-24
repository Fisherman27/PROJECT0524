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

import { MaterialPreAnalysis, QuestionPreAnalysis } from "@/types/replay";

const STORAGE_KEY = "interview-replay-context";
const FILES_KEY = "interview-replay-files";
const MATERIAL_ANALYSIS_KEY = "interview-replay-material-analysis";
const QUESTION_PLANS_KEY = "interview-replay-question-plans";
const MATERIAL_ANALYSIS_INPUT_KEY = "interview-replay-material-input";

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

function loadMaterialAnalysis(): MaterialPreAnalysis | null {
  try {
    const raw = localStorage.getItem(MATERIAL_ANALYSIS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveMaterialAnalysis(data: MaterialPreAnalysis | null) {
  try {
    if (data) {
      localStorage.setItem(MATERIAL_ANALYSIS_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(MATERIAL_ANALYSIS_KEY);
      localStorage.removeItem(MATERIAL_ANALYSIS_INPUT_KEY);
    }
  } catch { void 0; }
}

function loadMaterialAnalysisInput(): string {
  try { return localStorage.getItem(MATERIAL_ANALYSIS_INPUT_KEY) || ""; } catch { return ""; }
}

function saveMaterialAnalysisInput(data: { backgroundMaterials: string; targetDirection: string; targetSchool: string }) {
  try { localStorage.setItem(MATERIAL_ANALYSIS_INPUT_KEY, JSON.stringify(data)); } catch { void 0; }
}

function loadQuestionPlans(): Record<string, QuestionPreAnalysis> {
  try {
    const raw = localStorage.getItem(QUESTION_PLANS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveQuestionPlans(data: Record<string, QuestionPreAnalysis>) {
  try { localStorage.setItem(QUESTION_PLANS_KEY, JSON.stringify(data)); } catch { void 0; }
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
  const [materialAnalysis, setMaterialAnalysisState] = useState<MaterialPreAnalysis | null>(null);
  const [questionPlans, setQuestionPlansState] = useState<Record<string, QuestionPreAnalysis>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setData(loadFromStorage());
    setFiles(loadFiles());
    setMaterialAnalysisState(loadMaterialAnalysis());
    setQuestionPlansState(loadQuestionPlans());
    setMounted(true);
  }, []);

  const update = useCallback((partial: Partial<InterviewContextData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(next);
      return next;
    });
  }, []);

  const setMaterialAnalysis = useCallback((analysis: MaterialPreAnalysis | null, input?: { backgroundMaterials: string; targetDirection: string; targetSchool: string }) => {
    setMaterialAnalysisState(analysis);
    saveMaterialAnalysis(analysis);
    if (input) saveMaterialAnalysisInput(input);
  }, []);

  const isMaterialAnalysisStale = useCallback((backgroundMaterials: string, targetDirection: string, targetSchool: string): boolean => {
    if (!materialAnalysis) return false;
    const prevInput = loadMaterialAnalysisInput();
    if (!prevInput) return true;
    try {
      const prev = JSON.parse(prevInput);
      return prev.backgroundMaterials !== backgroundMaterials ||
        prev.targetDirection !== targetDirection ||
        prev.targetSchool !== targetSchool;
    } catch { return true; }
  }, [materialAnalysis]);

  const setQuestionPlan = useCallback((key: string, plan: QuestionPreAnalysis | null) => {
    setQuestionPlansState((prev) => {
      const next = { ...prev };
      if (plan) next[key] = plan;
      else delete next[key];
      saveQuestionPlans(next);
      return next;
    });
  }, []);

  const clearQuestionPlans = useCallback(() => {
    setQuestionPlansState({});
    saveQuestionPlans({});
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
    setMaterialAnalysisState(null);
    setQuestionPlansState({});
    saveToStorage(defaultContext);
    saveFiles([]);
    saveMaterialAnalysis(null);
    saveMaterialAnalysisInput({ backgroundMaterials: "", targetDirection: "", targetSchool: "" });
    saveQuestionPlans({});
  }, []);

  const fullMaterials = buildFullMaterials(data.backgroundMaterials, files);

  return {
    data, files, fullMaterials,
    materialAnalysis, setMaterialAnalysis,
    isMaterialAnalysisStale,
    questionPlans, setQuestionPlan, clearQuestionPlans,
    update, addFile, removeFile, updateFileLabel, clear, mounted,
  };
}
