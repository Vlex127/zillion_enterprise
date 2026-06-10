import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { getRevenueHistory, getTopProducts, getTodayMetrics } from "@/lib/queries"
import { AnalyticsClient } from "./client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const [revenueHistory, topProducts, metrics] = await Promise.all([
    getRevenueHistory(30),
    getTopProducts(10),
    getTodayMetrics(),
  ])

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <AnalyticsClient
        revenueHistory={revenueHistory}
        topProducts={topProducts}
        metrics={metrics}
      />
    </div>
  )
}
