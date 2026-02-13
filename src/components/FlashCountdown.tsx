// src/components/FlashCountdown.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";

type Props = { endsAt: string | Date | null };

export default function FlashCountdown({ endsAt }: Props) {
  if (!endsAt) return null;

  // Normalize to a timestamp (ms). Memoize so it's stable across renders.
  const targetTs = useMemo(() => {
    const d =
      typeof endsAt === "string" ? new Date(endsAt) : new Date(endsAt as Date);
    return Number(d.getTime()) || 0;
  }, [endsAt]);

  const [left, setLeft] = useState(() => Math.max(0, targetTs - Date.now()));

  useEffect(() => {
    // If target is already passed, set 0 and bail
    if (targetTs <= Date.now()) {
      setLeft(0);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, targetTs - Date.now());
      setLeft(diff);
      if (diff <= 0) {
        // ensure we clear and set 0 one last time
        clearInterval(timer);
        setLeft(0);
      }
    };

    // run first tick to avoid waiting one second
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [targetTs]);

  if (left <= 0) {
    return (
      <span className="text-sm text-red-500" role="status" aria-live="polite">
        Ended
      </span>
    );
  }

  const sec = Math.floor(left / 1000) % 60;
  const min = Math.floor(left / (1000 * 60)) % 60;
  const hrs = Math.floor(left / (1000 * 60 * 60)) % 24;
  const days = Math.floor(left / (1000 * 60 * 60 * 24));

  const timeStr = `${days > 0 ? `${days}d ` : ""}${String(hrs).padStart(
    2,
    "0"
  )}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

  return (
    <div
      className="inline-flex items-center gap-2 text-xs bg-red-50 text-red-600 px-2 py-1 rounded"
      role="status"
      aria-live="polite"
      aria-label={`Flash sale ends in ${timeStr}`}
    >
      <svg
        className="w-3 h-3"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d="M12 7a1 1 0 011 1v4.586l2.707 2.707a1 1 0 01-1.414 1.414L11 13.414V8a1 1 0 011-1z" />
      </svg>
      <span>{timeStr}</span>
    </div>
  );
}
