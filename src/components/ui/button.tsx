import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
  loading?: boolean;
};

const base =
  "press inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 disabled:pointer-events-none disabled:opacity-50 sm:h-10";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-white text-black hover:bg-brand hover:text-black",
  ghost: "text-muted hover:bg-white/5 hover:text-ink",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
  outline: "border border-white/15 text-ink hover:border-brand hover:text-brand",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", loading, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <button ref={ref} className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});
