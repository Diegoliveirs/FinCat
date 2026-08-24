import { z } from "zod";

const id = z.coerce.number().int().positive();

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD");

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, "Mes deve estar no formato AAAA-MM");

export const accountSchema = z.object({
  name: z.string().min(1, "Nome obrigatorio").max(60),
  type: z.enum(["cc", "poupanca", "dinheiro"]),
  initialBalanceCents: z.coerce.number().int().min(0).default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatorio").max(40),
  kind: z.enum(["income", "expense"]),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#A3BFFF"),
  sortOrder: z.coerce.number().int().default(0),
});

export const transactionSchema = z.object({
  accountId: id,
  categoryId: id,
  type: z.enum(["income", "expense"]),
  amountCents: z.coerce.number().int().positive("Valor deve ser maior que zero"),
  description: z.string().max(120).default(""),
  date: dateSchema,
});
export const transactionUpdateSchema = transactionSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração");

export const budgetSchema = z.object({
  categoryId: id,
  month: monthSchema,
  limitCents: z.coerce.number().int().positive(),
});

export const accountUpdateSchema = accountSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração");
export const categoryUpdateSchema = categorySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Informe ao menos uma alteração");

export const registerTransactionSchema = z.object({
  accountId: id.optional().describe("Id da conta. Omita se a conta nao estiver clara."),
  categoryId: id.optional().describe("Id da categoria. Omita se a categoria nao estiver clara."),
  accountName: z.string().optional().describe("Nome da conta se o usuario citar uma conta que ja existe"),
  categoryName: z.string().optional().describe("Nome da categoria se o usuario citar uma categoria que ja existe"),
  type: z.enum(["income", "expense"]).describe("income = receita, expense = despesa"),
  amountCents: z.coerce.number().int().positive().describe("Valor em centavos. R$ 45,00 = 4500"),
  description: z.string().max(120).describe("Descricao curta da transacao"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Data AAAA-MM-DD. Use a data informada ou hoje."),
});

export const financialProfileSchema = z.object({
  desiredReserveCents: z.coerce.number().int().min(0),
  minimumMonthlySurplusCents: z.coerce.number().int().min(0),
  unregisteredDebtCents: z.coerce.number().int().min(0),
  monthlyIncomeCents: z.coerce.number().int().positive().nullable(),
  incomeStability: z.enum(["stable", "variable", "unknown"]),
  maxIncomeCommitmentPercent: z.coerce.number().min(1).max(100),
});

export const financialGoalCreateSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da meta").max(80),
  targetAmountCents: z.coerce.number().int().positive("O valor da meta deve ser maior que zero"),
  targetDate: dateSchema,
  initialAmountCents: z.coerce.number().int().min(0).default(0),
});

const financialGoalUpdateFields = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  targetAmountCents: z.coerce.number().int().positive().optional(),
  targetDate: dateSchema.optional(),
});
export const financialGoalUpdateSchema = financialGoalUpdateFields.refine(
  (value) => Object.keys(value).length > 0,
  "Informe ao menos uma alteração",
);

export const savingsEntrySchema = z.object({
  goalId: id.nullable().optional(),
  amountCents: z.coerce.number().int().positive("O valor guardado deve ser maior que zero"),
  savedAt: dateSchema,
  description: z.string().trim().max(120).default(""),
});

export const agentIdSchema = z.enum(["auto", "siamesinho", "frajolinha", "persinha", "laranjinha"]);

export const proposalSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("transaction_create"), data: transactionSchema }),
  z.object({
    kind: z.literal("transaction_update"),
    data: z.object({ transactionId: id }).and(transactionUpdateSchema),
  }),
  z.object({ kind: z.literal("transaction_delete"), data: z.object({ transactionId: id }) }),
  z.object({
    kind: z.literal("reclassification"),
    data: z.object({ transactionId: id, categoryId: id, description: z.string().max(120).optional() }),
  }),
  z.object({ kind: z.literal("account_create"), data: accountSchema }),
  z.object({ kind: z.literal("account_update"), data: z.object({ accountId: id }).and(accountUpdateSchema) }),
  z.object({ kind: z.literal("account_delete"), data: z.object({ accountId: id }) }),
  z.object({ kind: z.literal("category_create"), data: categorySchema }),
  z.object({ kind: z.literal("category_update"), data: z.object({ categoryId: id }).and(categoryUpdateSchema) }),
  z.object({ kind: z.literal("category_delete"), data: z.object({ categoryId: id }) }),
  z.object({ kind: z.literal("budget_upsert"), data: budgetSchema }),
  z.object({ kind: z.literal("budget_delete"), data: z.object({ budgetId: id }) }),
  z.object({
    kind: z.literal("profile_update"),
    data: financialProfileSchema.partial().refine((value) => Object.keys(value).length > 0),
  }),
  z.object({ kind: z.literal("goal_create"), data: financialGoalCreateSchema }),
  z.object({ kind: z.literal("goal_update"), data: z.object({ goalId: id }).and(financialGoalUpdateSchema) }),
  z.object({ kind: z.literal("goal_archive"), data: z.object({ goalId: id }) }),
  z.object({ kind: z.literal("savings_create"), data: savingsEntrySchema }),
  z.object({ kind: z.literal("savings_delete"), data: z.object({ savingsId: id }) }),
]);

export type ProposalInput = z.infer<typeof proposalSchema>;

export type TransactionInput = z.infer<typeof transactionSchema>;
