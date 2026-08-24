type Props = {
  percent: number;
  color?: string;
  over?: boolean;
};

export function ProgressBar({ percent, color, over }: Props) {
  const p = Math.min(100, Math.max(0, percent));
  const barColor = over ? "var(--color-danger)" : (color ?? "var(--color-brand)");
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${p}%`, background: barColor }}
      />
    </div>
  );
}
