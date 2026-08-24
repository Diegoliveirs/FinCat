"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <p className="text-danger text-sm">Erro: {error.message || "algo deu errado"}</p>
      <button
        onClick={reset}
        className="press text-ink hover:border-brand rounded-full border border-white/15 px-4 py-2 text-sm"
      >
        Tentar de novo
      </button>
    </div>
  );
}
