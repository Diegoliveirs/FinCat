import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`bg-bg/60 text-ink placeholder:text-muted/50 focus:border-brand/60 w-full rounded-xl border border-white/10 px-3.5 py-2.5 text-sm transition-colors outline-none ${className}`}
      {...rest}
    />
  );
});
