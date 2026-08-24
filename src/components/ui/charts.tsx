"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatBRL } from "@/lib/money";

function moneyTick(value: number) {
  return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`;
}

export function CategoryDonut({ data }: { data: Array<{ name: string; color: string; totalCents: number }> }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="totalCents"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatBRL(Number(value)), ""]}
            contentStyle={{
              background: "#1f1f23",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
            }}
            labelStyle={{ color: "#fff" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EvolutionChart({ data }: { data: Array<{ month: string; income: number; expense: number }> }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CFFF04" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#CFFF04" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC94A6" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FC94A6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={moneyTick}
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            formatter={(value) => [formatBRL(Number(value)), ""]}
            contentStyle={{
              background: "#1f1f23",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "0.75rem",
              fontSize: "0.75rem",
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Entradas"
            stroke="#CFFF04"
            strokeWidth={2}
            fill="url(#gradIncome)"
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Saídas"
            stroke="#FC94A6"
            strokeWidth={2}
            fill="url(#gradExpense)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
