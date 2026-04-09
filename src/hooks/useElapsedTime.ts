import { useEffect, useMemo, useState } from "react";
import { formatElapsedTime } from "../battle";

export function useElapsedTime(startedAt?: number | null, frozenAt?: number | null) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || frozenAt) {
      return;
    }

    setNow(Date.now());
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [frozenAt, startedAt]);

  const elapsedMs = useMemo(() => {
    if (!startedAt) {
      return 0;
    }

    return Math.max(0, (frozenAt ?? now) - startedAt);
  }, [frozenAt, now, startedAt]);

  return {
    elapsedMs,
    formattedElapsed: formatElapsedTime(elapsedMs),
  };
}
