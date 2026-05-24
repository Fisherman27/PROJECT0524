"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PreReplayStage, AnswerLockReason } from "@/types/replay";

interface UsePreAnswerTimerOptions {
  defaultDurationSeconds: number;
  preparationSeconds: number;
  onAbandoned: () => void;
  onLocked: (reason: AnswerLockReason) => void;
}

export function usePreAnswerTimer({
  defaultDurationSeconds,
  preparationSeconds,
  onAbandoned,
  onLocked,
}: UsePreAnswerTimerOptions) {
  const [stage, setStage] = useState<PreReplayStage>("editing");
  const [prepSecondsLeft, setPrepSecondsLeft] = useState(preparationSeconds);
  const [answerSecondsLeft, setAnswerSecondsLeft] = useState(defaultDurationSeconds);
  const [answerDuration, setAnswerDuration] = useState(defaultDurationSeconds);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockReasonRef = useRef<AnswerLockReason>("timeout");

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPreparation = useCallback(() => {
    clearTimer();
    setStage("ready");
    setPrepSecondsLeft(preparationSeconds);
    setAnswerSecondsLeft(answerDuration);

    intervalRef.current = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setStage("abandoned");
          onAbandoned();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, preparationSeconds, answerDuration, onAbandoned]);

  const startAnswering = useCallback(() => {
    clearTimer();
    setStage("liveAnswering");
    setAnswerSecondsLeft(answerDuration);

    intervalRef.current = setInterval(() => {
      setAnswerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          lockReasonRef.current = "timeout";
          setStage("liveLocked");
          onLocked("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer, answerDuration, onLocked]);

  const lockAnswer = useCallback(() => {
    clearTimer();
    lockReasonRef.current = "manual";
    setStage("liveLocked");
    onLocked("manual");
  }, [clearTimer, onLocked]);

  const resetRound = useCallback(() => {
    clearTimer();
    setStage("editing");
    setPrepSecondsLeft(preparationSeconds);
    setAnswerSecondsLeft(answerDuration);
  }, [clearTimer, preparationSeconds, answerDuration]);

  const setDuration = useCallback((secs: number) => {
    setAnswerDuration(secs);
    setAnswerSecondsLeft(secs);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    stage,
    setStage,
    prepSecondsLeft,
    answerSecondsLeft,
    answerDuration,
    setDuration,
    startPreparation,
    startAnswering,
    lockAnswer,
    resetRound,
  };
}
