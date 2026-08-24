export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`card-border rounded-card bg-surface ${className}`}>{children}</div>;
}
