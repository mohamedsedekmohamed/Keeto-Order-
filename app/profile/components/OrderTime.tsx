"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Translate = (key: string) => string | undefined;

function parseOrderDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const match = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)$/i,
  );

  if (match) {
    const [, dd, mm, yyyy, hh, min, sec, meridiem] = match;
    let hours = parseInt(hh, 10);
    if (/pm/i.test(meridiem) && hours !== 12) hours += 12;
    if (/am/i.test(meridiem) && hours === 12) hours = 0;
    return new Date(
      parseInt(yyyy, 10),
      parseInt(mm, 10) - 1,
      parseInt(dd, 10),
      hours,
      parseInt(min, 10),
      parseInt(sec, 10),
    );
  }

  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function formatOrderDateTime(value: string | null | undefined): string | null {
  const date = parseOrderDate(value);
  if (!date) return null;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useDurationCountdown(
  orderKey: string | null | undefined,
  durationMinutes: number | null | undefined,
) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    if (!orderKey || !durationMinutes || durationMinutes <= 0) {
      return;
    }

    const storageKey = `prep-countdown-start:${orderKey}:${durationMinutes}`;
    let startedAt: number | null = null;

    if (typeof window !== "undefined") {
      const stored = Number(window.localStorage.getItem(storageKey));
      startedAt = stored > 0 ? stored : null;
    }

    if (!startedAt) {
      startedAt = Date.now();
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, String(startedAt));
      }
    }

    const target = startedAt + durationMinutes * 60 * 1000;
    const tick = () => {
      const diff = target - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [orderKey, durationMinutes]);

  return orderKey && durationMinutes && durationMinutes > 0
    ? remainingMs
    : null;
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function OrderCreatedAt({
  createdAt,
  t,
  className = "",
}: {
  createdAt: string | null | undefined;
  t: Translate;
  className?: string;
}) {
  const createdAtLabel = formatOrderDateTime(createdAt);
  if (!createdAtLabel) return null;

  return (
    <span
      className={`text-[10px] text-gray-400 dark:text-zinc-500 ${className}`}
    >
      {t("orderedAt") || "وقت الطلب"}: {createdAtLabel}
    </span>
  );
}

export function PrepCountdown({
  orderKey,
  durationMinutes,
  t,
  className = "",
}: {
  orderKey: string | null | undefined;
  durationMinutes: number | null | undefined;
  t: Translate;
  className?: string;
}) {
  const remainingMs = useDurationCountdown(orderKey, durationMinutes);

  if (remainingMs === null || !durationMinutes) return null;

  const isDone = remainingMs <= 0;

  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg w-fit ${
        isDone
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-yellow-400/10 text-yellow-600 dark:text-yellow-400"
      } ${className}`}
    >
      <Clock size={12} />
      {isDone
        ? t("orderShouldBeReady") || "من المفترض أن يكون الطلب جاهزًا"
        : `${t("remainingPrepTime") || "الوقت المتبقي"} ${formatCountdown(remainingMs)}`}
    </div>
  );
}
