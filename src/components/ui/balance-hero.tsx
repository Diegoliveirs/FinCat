"use client";

import { useEffect, useRef, useState } from "react";
import { formatBRL } from "@/lib/money";
import { CatMood, moodForBalance, type CatMoodKind } from "./cat-mood";

const DURATION = 600;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(target: number) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const v = Math.round(from + (target - from) * easeOutCubic(t));
      setDisplay(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return display;
}

export function BalanceHero({ totalCents, mood }: { totalCents: number; mood?: CatMoodKind }) {
  const display = useCountUp(totalCents);
  const m = mood ?? moodForBalance(totalCents);
  const positive = totalCents >= 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-muted text-sm">Saldo total</div>
        <div
          className="balance-number mt-2"
          style={{ color: positive ? "var(--color-brand)" : "var(--color-danger)", transition: "color 200ms" }}
        >
          {formatBRL(display)}
        </div>
        <div className="text-muted mt-2 text-xs">Sua posição agora, meu amigo.</div>
      </div>
      <CatMood mood={m} className="size-24 shrink-0" />
    </div>
  );
}
