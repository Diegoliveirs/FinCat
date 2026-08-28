import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Sidebar, BottomNav } from "@/components/layout/nav";
import { CatPanel } from "@/components/ai/cat-panel";
import "./globals.css";
import { getSession } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FinCat — finanças que cabem no bolso",
  description: "Controle pessoal de finanças com um gato de assistente.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession().catch(() => null);
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen">
        {session ? (
          <div className="flex min-h-screen">
            <Sidebar user={session.user} />
            <main className="min-w-0 flex-1 px-4 pt-6 pb-24 sm:px-8 md:pb-8 lg:ml-64 lg:pl-8 xl:pr-[23rem]">
              <div className="mx-auto w-full max-w-5xl">{children}</div>
            </main>
            <CatPanel />
          </div>
        ) : (
          <main>{children}</main>
        )}
        {session ? <BottomNav isAdmin={session.user.role === "admin"} /> : null}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{ style: { background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" } }}
        />
      </body>
    </html>
  );
}
