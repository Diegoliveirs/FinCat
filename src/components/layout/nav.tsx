"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Target, Wallet, Tags, Flag, MoreHorizontal, X, Users, LogOut } from "lucide-react";
import { CatMark } from "@/components/ui/cat-mood";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/orcamentos", label: "Orçamentos", icon: Target },
  { href: "/metas", label: "Metas", icon: Flag },
  { href: "/contas", label: "Contas", icon: Wallet },
  { href: "/categorias", label: "Categorias", icon: Tags },
];

function useIsActive(href: string, exact = false) {
  const pathname = usePathname();
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link href="/" className="mb-8 flex items-center gap-3 px-2">
      <div className="bg-brand/10 flex size-10 items-center justify-center rounded-full">
        <CatMark mood="neutro" className="size-9" label="FinCat" />
      </div>
      <div>
        <div className="text-sm font-bold tracking-tight">FinCat</div>
        <div className="text-muted text-[11px]">finanças + gato</div>
      </div>
    </Link>
  );
}

export function Sidebar({ user }: { user: { name: string; username?: string | null; role?: string | null } }) {
  const router = useRouter();
  const visibleItems = user.role === "admin" ? [...items, { href: "/admin/usuarios", label: "Usuários", icon: Users }] : items;
  return (
    <aside className="bg-surface fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 px-4 py-6 lg:flex">
      <Brand />
      <nav className="flex flex-col gap-1">
        {visibleItems.map(({ href, label, icon: Icon, exact }) => {
          const active = useIsActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? "text-ink bg-white/8" : "text-muted hover:text-ink hover:bg-white/5"
              }`}
            >
              <Icon className={`size-4 ${active ? "text-brand" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2">
        <div className="mb-3 flex items-center justify-between border-t border-white/10 pt-4"><div className="min-w-0"><div className="truncate text-sm font-semibold">{user.name}</div><div className="text-muted truncate text-xs">@{user.username}</div></div><button className="text-muted hover:text-ink rounded-lg p-2" aria-label="Sair" onClick={async () => { await authClient.signOut(); router.push("/login"); router.refresh(); }}><LogOut className="size-4" /></button></div>
        <div className="bg-bg/60 rounded-xl border border-white/10 p-3">
          <div className="text-muted text-[11px]">Sugestão</div>
          <div className="text-muted mt-1 text-xs">Pergunta ao gato: "gastei 45 no mercado ontem"</div>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const primaryItems = items.slice(0, 4);
  const secondaryItems = [...items.slice(4), ...(isAdmin ? [{ href: "/admin/usuarios", label: "Usuários", icon: Users }] : [])];
  const secondaryActive = secondaryItems.some(({ href }) => pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      {moreOpen ? (
        <div className="bg-surface fixed inset-x-3 bottom-20 z-40 rounded-2xl border border-white/10 p-2 shadow-2xl lg:hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-ink text-xs font-semibold">Mais seções</span>
            <button
              type="button"
              onClick={() => setMoreOpen(false)}
              className="text-muted rounded-lg p-2"
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </button>
          </div>
          {secondaryItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMoreOpen(false)}
              className="text-ink flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-white/5"
            >
              <Icon className="text-brand size-5" />
              {label}
            </Link>
          ))}
        </div>
      ) : null}
      <nav className="bg-surface/95 fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-center border-t border-white/10 px-1 py-2 backdrop-blur lg:hidden">
        {primaryItems.map(({ href, label, icon: Icon, exact }) => {
          const active = useIsActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={`press flex min-w-0 flex-col items-center gap-1 rounded-lg px-0 py-1.5 text-[9px] ${
                active ? "text-brand" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className={`press flex min-w-0 flex-col items-center gap-1 rounded-lg px-0 py-1.5 text-[9px] ${secondaryActive || moreOpen ? "text-brand" : "text-muted"}`}
          aria-expanded={moreOpen}
          aria-label="Abrir mais seções"
        >
          <MoreHorizontal className="size-5" />
          Mais
        </button>
      </nav>
    </>
  );
}
