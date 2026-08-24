import { relations } from "drizzle-orm";
import { foreignKey, index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  role: text("role").notNull().default("user"),
  banned: integer("banned", { mode: "boolean" }).notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  forcePasswordChange: integer("force_password_change", { mode: "boolean" }).notNull().default(false),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (t) => [index("session_user_id_idx").on(t.userId)]);

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  issuer: text("issuer").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"), refreshToken: text("refresh_token"), idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"), password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => [index("auth_account_user_id_idx").on(t.userId), uniqueIndex("auth_account_issuer_account_idx").on(t.issuer, t.accountId)]);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }), updatedAt: integer("updated_at", { mode: "timestamp" }),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);

export const rateLimit = sqliteTable("rate_limit", {
  id: text("id").primaryKey(), key: text("key").notNull().unique(), count: integer("count").notNull(), lastRequest: integer("last_request").notNull(),
});

const ownedId = (name: string) => integer(name).primaryKey({ autoIncrement: true });
export const accounts = sqliteTable("accounts", {
  id: ownedId("id"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(), type: text("type", { enum: ["cc", "poupanca", "dinheiro"] }).notNull().default("cc"),
  initialBalanceCents: integer("initial_balance_cents").notNull().default(0), createdAt: integer("created_at").notNull().default(0),
}, (t) => [uniqueIndex("accounts_id_user_idx").on(t.id, t.userId), index("accounts_user_idx").on(t.userId)]);

export const categories = sqliteTable("categories", {
  id: ownedId("id"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(), kind: text("kind", { enum: ["income", "expense"] }).notNull().default("expense"),
  color: text("color").notNull().default("#A3BFFF"), sortOrder: integer("sort_order").notNull().default(0),
}, (t) => [uniqueIndex("categories_id_user_idx").on(t.id, t.userId), index("categories_user_idx").on(t.userId)]);

export const transactions = sqliteTable("transactions", {
  id: ownedId("id"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull(), categoryId: integer("category_id").notNull(),
  type: text("type", { enum: ["income", "expense"] }).notNull(), amountCents: integer("amount_cents").notNull(),
  description: text("description").notNull().default(""), date: text("date").notNull(), createdAt: integer("created_at").notNull().default(0),
}, (t) => [
  uniqueIndex("transactions_id_user_idx").on(t.id, t.userId), index("transactions_user_date_idx").on(t.userId, t.date),
  foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }).onDelete("cascade"),
  foreignKey({ columns: [t.categoryId, t.userId], foreignColumns: [categories.id, categories.userId] }),
]);

export const budgets = sqliteTable("budgets", {
  id: ownedId("id"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull(), month: text("month").notNull(), limitCents: integer("limit_cents").notNull(),
}, (t) => [uniqueIndex("budgets_id_user_idx").on(t.id, t.userId), uniqueIndex("budgets_user_category_month_idx").on(t.userId, t.categoryId, t.month), foreignKey({ columns: [t.categoryId, t.userId], foreignColumns: [categories.id, categories.userId] }).onDelete("cascade")]);

export const financialProfile = sqliteTable("financial_profile", {
  id: ownedId("id"), userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  desiredReserveCents: integer("desired_reserve_cents").notNull().default(0), minimumMonthlySurplusCents: integer("minimum_monthly_surplus_cents").notNull().default(0),
  unregisteredDebtCents: integer("unregistered_debt_cents").notNull().default(0), monthlyIncomeCents: integer("monthly_income_cents"),
  incomeStability: text("income_stability", { enum: ["stable", "variable", "unknown"] }).notNull().default("unknown"),
  maxIncomeCommitmentPercent: real("max_income_commitment_percent").notNull().default(30), updatedAt: integer("updated_at").notNull().default(0),
});

export const financialGoals = sqliteTable("financial_goals", {
  id: ownedId("id"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), name: text("name").notNull(),
  targetAmountCents: integer("target_amount_cents").notNull(), targetDate: text("target_date").notNull(),
  status: text("status", { enum: ["active", "completed", "archived"] }).notNull().default("active"), createdAt: integer("created_at").notNull().default(0),
  updatedAt: integer("updated_at").notNull().default(0), completedAt: integer("completed_at"),
}, (t) => [uniqueIndex("goals_id_user_idx").on(t.id, t.userId), index("goals_user_status_idx").on(t.userId, t.status, t.targetDate)]);

export const savingsEntries = sqliteTable("savings_entries", {
  id: ownedId("id"), userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }), goalId: integer("goal_id"),
  amountCents: integer("amount_cents").notNull(), savedAt: text("saved_at").notNull(), description: text("description").notNull().default(""), createdAt: integer("created_at").notNull().default(0),
}, (t) => [uniqueIndex("savings_id_user_idx").on(t.id, t.userId), index("savings_user_date_idx").on(t.userId, t.savedAt), foreignKey({ columns: [t.goalId, t.userId], foreignColumns: [financialGoals.id, financialGoals.userId] }).onDelete("cascade")]);

export const accountsRelations = relations(accounts, ({ many }) => ({ transactions: many(transactions) }));
export const categoriesRelations = relations(categories, ({ many }) => ({ transactions: many(transactions), budgets: many(budgets) }));
export const financialGoalsRelations = relations(financialGoals, ({ many }) => ({ savingsEntries: many(savingsEntries) }));
export type Account = typeof accounts.$inferSelect; export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect; export type Budget = typeof budgets.$inferSelect;
export type FinancialProfile = typeof financialProfile.$inferSelect; export type FinancialGoal = typeof financialGoals.$inferSelect;
export type SavingsEntry = typeof savingsEntries.$inferSelect;
