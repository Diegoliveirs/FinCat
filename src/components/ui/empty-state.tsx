import { CatMood } from "@/components/ui/cat-mood";

export function EmptyState({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-card bg-surface/40 flex flex-col items-center gap-3 border border-dashed border-white/15 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-white/5">
        <CatMood mood="neutro" className="size-10" />
      </div>
      <p className="text-muted text-sm">{title}</p>
      {action}
    </div>
  );
}
