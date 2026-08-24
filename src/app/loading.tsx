import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Carregando painel">
      <section className="dashboard-intro">
        <div className="agent-reading">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mt-3 h-4 w-64" />
        </div>
        <Skeleton className="h-36 rounded-3xl" />
        <div className="py-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-16 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-px sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </section>
      <Skeleton className="h-56" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-52" />
    </div>
  );
}
