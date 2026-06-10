import { getTodayMetrics, getLowStockProducts, getRecentSales } from "@/lib/queries"
import { DashboardClient } from "./client"

export default async function AdminDashboardPage() {
  const [metrics, lowStock, sales] = await Promise.all([
    getTodayMetrics(),
    getLowStockProducts(),
    getRecentSales(),
  ])

  return (
    <DashboardClient
      metrics={metrics}
      lowStock={lowStock}
      sales={sales}
    />
  )
}
