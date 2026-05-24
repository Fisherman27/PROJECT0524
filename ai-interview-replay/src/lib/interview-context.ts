"use client";

import { useState, useEffect, useCallback } from "react";

export interface InterviewContextData {
  interviewType: string;
  targetDirection: string;
  targetSchool: string;
  backgroundMaterials: string;
}

const STORAGE_KEY = "interview-replay-context";

const defaultContext: InterviewContextData = {
  interviewType: "",
  targetDirection: "",
  targetSchool: "",
  backgroundMaterials: "",
};

function load(): InterviewContextData {
  if (typeof window === "undefined") return defaultContext;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultContext, ...JSON.parse(raw) };
  } catch {
    void 0;
  }
  return defaultContext;
}

function save(data: InterviewContextData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    void 0;
  }
}

export function useInterviewContext() {
  const [data, setData] = useState<InterviewContextData>(defaultContext);

  useEffect(() => {
    setData(load());
  }, []);

  const update = useCallback((partial: Partial<InterviewContextData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setData(defaultContext);
    save(defaultContext);
  }, []);

  return { data, update, clear };
}
