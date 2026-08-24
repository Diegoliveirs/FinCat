import { CatMark } from "@/components/ui/cat-mood";
export function AuthShell({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return <div className="auth-shell"><section className="auth-brand"><div className="auth-logo"><CatMark mood="neutro" className="size-10" label="FinCat" /><span>FinCat</span></div><div><h1>Seu dinheiro.<br />Seu território.</h1><p>Uma porta segura para decisões financeiras mais claras.</p></div><span className="auth-index">FC / 01</span></section><section className="auth-panel"><div className="auth-panel-inner"><h2>{title}</h2><p>{text}</p>{children}</div></section></div>;
}
