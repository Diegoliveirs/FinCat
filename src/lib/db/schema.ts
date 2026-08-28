import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  index,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Timestamps in the app are Unix milliseconds (`Date.now()`), which exceed the
// PostgreSQL `integer` limit. Keeping number mode avoids BigInt changes in APIs.
const epoch = (name: string) => bigint(name, { mode: "number" });
const ownedId = (name: string) => serial(name).primaryKey();

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true }),
  forcePasswordChange: boolean("force_password_change").notNull().default(false),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("auth_account_user_id_idx").on(t.userId),
    uniqueIndex("auth_account_issuer_account_idx").on(t.issuer, t.accountId),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: epoch("last_request").notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: ownedId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: ["cc", "poupanca", "dinheiro"] })
      .notNull()
      .default("cc"),
    initialBalanceCents: integer("initial_balance_cents").notNull().default(0),
    createdAt: epoch("created_at").notNull().default(0),
  },
  (t) => [uniqueIndex("accounts_id_user_idx").on(t.id, t.userId), index("accounts_user_idx").on(t.userId)],
);

export const categories = pgTable(
  "categories",
  {
    id: ownedId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["income", "expense"] })
      .notNull()
      .default("expense"),
    color: text("color").notNull().default("#A3BFFF"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [uniqueIndex("categories_id_user_idx").on(t.id, t.userId), index("categories_user_idx").on(t.userId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: ownedId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: integer("account_id").notNull(),
    categoryId: integer("category_id").notNull(),
    type: text("type", { enum: ["income", "expense"] }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    description: text("description").notNull().default(""),
    date: text("date").notNull(),
    createdAt: epoch("created_at").notNull().default(0),
  },
  (t) => [
    uniqueIndex("transactions_id_user_idx").on(t.id, t.userId),
    index("transactions_user_date_idx").on(t.userId, t.date),
    foreignKey({ columns: [t.accountId, t.userId], foreignColumns: [accounts.id, accounts.userId] }).onDelete(
      "cascade",
    ),
    foreignKey({ columns: [t.categoryId, t.userId], foreignColumns: [categories.id, categories.userId] }),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: ownedId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull(),
    month: text("month").notNull(),
    limitCents: integer("limit_cents").notNull(),
  },
  (t) => [
    uniqueIndex("budgets_id_user_idx").on(t.id, t.userId),
    uniqueIndex("budgets_user_category_month_idx").on(t.userId, t.categoryId, t.month),
    foreignKey({ columns: [t.categoryId, t.userId], foreignColumns: [categories.id, categories.userId] }).onDelete(
      "cascade",
    ),
  ],
);

export const financialProfile = pgTable("financial_profile", {
  id: ownedId("id"),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  desiredReserveCents: integer("desired_reserve_cents").notNull().default(0),
  minimumMonthlySurplusCents: integer("minimum_monthly_surplus_cents").notNull().default(0),
  unregisteredDebtCents: integer("unregistered_debt_cents").notNull().default(0),
  monthlyIncomeCents: integer("monthly_income_cents"),
  incomeStability: text("income_stability", { enum: ["stable", "variable", "unknown"] })
    .notNull()
    .default("unknown"),
  maxIncomeCommitmentPercent: real("max_income_commitment_percent").notNull().default(30),
  updatedAt: epoch("updated_at").notNull().default(0),
});

export const financialGoals = pgTable(
  "financial_goals",
  {
    id: ownedId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmountCents: integer("target_amount_cents").notNull(),
    targetDate: text("target_date").notNull(),
    status: text("status", { enum: ["active", "completed", "archived"] })
      .notNull()
      .default("active"),
    createdAt: epoch("created_at").notNull().default(0),
    updatedAt: epoch("updated_at").notNull().default(0),
    completedAt: epoch("completed_at"),
  },
  (t) => [
    uniqueIndex("goals_id_user_idx").on(t.id, t.userId),
    index("goals_user_status_idx").on(t.userId, t.status, t.targetDate),
  ],
);

export const savingsEntries = pgTable(
  "savings_entries",
  {
    id: ownedId("id"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    goalId: integer("goal_id"),
    amountCents: integer("amount_cents").notNull(),
    savedAt: text("saved_at").notNull(),
    description: text("description").notNull().default(""),
    createdAt: epoch("created_at").notNull().default(0),
  },
  (t) => [
    uniqueIndex("savings_id_user_idx").on(t.id, t.userId),
    index("savings_user_date_idx").on(t.userId, t.savedAt),
    foreignKey({ columns: [t.goalId, t.userId], foreignColumns: [financialGoals.id, financialGoals.userId] }).onDelete(
      "cascade",
    ),
  ],
);

export const accountsRelations = relations(accounts, ({ many }) => ({ transactions: many(transactions) }));
export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
}));
export const financialGoalsRelations = relations(financialGoals, ({ many }) => ({
  savingsEntries: many(savingsEntries),
}));
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type FinancialProfile = typeof financialProfile.$inferSelect;
export type FinancialGoal = typeof financialGoals.$inferSelect;
export type SavingsEntry = typeof savingsEntries.$inferSelect;
