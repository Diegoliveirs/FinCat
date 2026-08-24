"use client";

import { useEffect, useState } from "react";
import { centsToInput, inputToCents } from "@/lib/money";

type Props = {
  value: number;
  onChange: (cents: number) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
};

export function CurrencyInput({ value, onChange, className = "", placeholder = "0,00", ariaLabel }: Props) {
  const [text, setText] = useState(centsToInput(value));

  useEffect(() => {
    setText(centsToInput(value));
  }, [value]);

  return (
    <div className="relative">
      <span className="text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm">
        R$
      </span>
      <input
        inputMode="numeric"
        aria-label={ariaLabel}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d,]/g, "").replace(/\D{2,}/g, "");
          setText(next);
          onChange(inputToCents(next));
        }}
        onFocus={(e) => e.target.select()}
        className={`bg-bg/60 text-ink focus:border-brand/60 w-full rounded-xl border border-white/10 py-2.5 pr-3.5 pl-10 font-mono text-sm transition-colors outline-none ${className}`}
      />
    </div>
  );
}
