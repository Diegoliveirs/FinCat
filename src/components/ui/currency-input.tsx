"use client";

import { useEffect, useRef, useState } from "react";
import { centsToInput, inputToCents, normalizeCurrencyInput } from "@/lib/money";

type Props = {
  value: number;
  onChange: (cents: number) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
};

export function CurrencyInput({ value, onChange, className = "", placeholder = "0,00", ariaLabel }: Props) {
  const [text, setText] = useState(centsToInput(value));
  const lastEmittedCents = useRef<number | null>(null);

  useEffect(() => {
    if (lastEmittedCents.current === value) {
      lastEmittedCents.current = null;
      return;
    }
    setText(centsToInput(value));
  }, [value]);

  return (
    <div className="relative">
      <span className="text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm">
        R$
      </span>
      <input
        inputMode="decimal"
        aria-label={ariaLabel ?? "Valor em reais"}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const next = normalizeCurrencyInput(e.target.value);
          setText(next);
          const cents = inputToCents(next);
          lastEmittedCents.current = cents;
          onChange(cents);
        }}
        onFocus={(e) => {
          if (value === 0) e.target.select();
        }}
        onBlur={() => setText(centsToInput(inputToCents(text)))}
        className={`bg-bg/60 text-ink focus:border-brand/60 w-full rounded-xl border border-white/10 py-2.5 pr-3.5 pl-10 font-mono text-sm transition-colors outline-none ${className}`}
      />
    </div>
  );
}
