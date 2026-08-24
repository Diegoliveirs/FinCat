import db from "@/lib/db";
import { categories, financialProfile } from "@/lib/db/schema";

export const DEFAULT_CATEGORIES = [
  { name: "Alimentação", kind: "expense" as const, color: "#FFEC7E", sortOrder: 1 },
  { name: "Mercado", kind: "expense" as const, color: "#D38DFF", sortOrder: 2 },
  { name: "Transporte", kind: "expense" as const, color: "#A3BFFF", sortOrder: 3 },
  { name: "Moradia", kind: "expense" as const, color: "#FC94A6", sortOrder: 4 },
  { name: "Lazer", kind: "expense" as const, color: "#FFEC7E", sortOrder: 5 },
  { name: "Saúde", kind: "expense" as const, color: "#A3BFFF", sortOrder: 6 },
  { name: "Salário", kind: "income" as const, color: "#CFFF04", sortOrder: 1 },
  { name: "Outros", kind: "income" as const, color: "#A3BFFF", sortOrder: 2 },
];

export function initializeUserData(userId: string) {
  db.transaction((tx) => {
    tx.insert(categories).values(DEFAULT_CATEGORIES.map((item) => ({ ...item, userId }))).onConflictDoNothing().run();
    tx.insert(financialProfile).values({ userId, updatedAt: Date.now() }).onConflictDoNothing().run();
  });
}
