"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Wallet, Banknote, CreditCard } from "lucide-react"

type DailyRevenue = {
  date: string
  revenue: number
  profit: number
}

type ProductSummary = {
  name: string
  total_qty: number
  total_revenue: number
}

type DashboardMetrics = {
  todayRevenue: number
  todayProfit: number
  cashTotal: number
  transferTotal: number
  posTotal: number
}

function formatCurrency(n: number) {
  return `NGN ${n.toLocaleString()}`
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function Bar({
  value,
  max,
  label,
  color = "bg-blue-500",
}: {
  value: number
  max: number
  label: string
  color?: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-10 text-right text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
        <div
          className={`h-full ${color} rounded-sm transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-20 text-right font-medium shrink-0">{formatCurrency(value)}</span>
    </div>
  )
}

export function AnalyticsClient({
  revenueHistory,
  topProducts,
  metrics,
}: {
  revenueHistory: DailyRevenue[]
  metrics: DashboardMetrics
  topProducts: ProductSummary[]
}) {
  const maxRevenue = Math.max(...revenueHistory.map((d) => d.revenue), 1)
  const maxProductRevenue = Math.max(...topProducts.map((p) => p.total_revenue), 1)

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue (30d)</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueHistory.reduce((s, d) => s + d.revenue, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profit (30d)</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenueHistory.reduce((s, d) => s + d.profit, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <Banknote className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.todayRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Revenue (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {revenueHistory.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sales data yet
            </p>
          )}
          {revenueHistory.map((d) => (
            <Bar
              key={d.date}
              label={formatDate(d.date)}
              value={d.revenue}
              max={maxRevenue}
            />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No sales data yet
              </p>
            )}
            {topProducts.map((p) => (
              <Bar
                key={p.name}
                label={p.name}
                value={p.total_revenue}
                max={maxProductRevenue}
                color="bg-emerald-500"
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods (Today)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Banknote className="size-4 text-green-600" />
                Cash
              </span>
              <span className="font-medium">{formatCurrency(metrics.cashTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CreditCard className="size-4 text-blue-600" />
                Transfer
              </span>
              <span className="font-medium">{formatCurrency(metrics.transferTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <CreditCard className="size-4 text-purple-600" />
                POS
              </span>
              <span className="font-medium">{formatCurrency(metrics.posTotal)}</span>
            </div>
            <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(metrics.todayRevenue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
