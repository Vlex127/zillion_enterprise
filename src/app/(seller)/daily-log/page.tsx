import { getSellerSales } from "@/lib/queries"
import { auth } from "@clerk/nextjs/server"
import { DailyLogClient } from "./client"

export default async function DailyLogPage() {
  const { userId } = await auth()
  const sales = await getSellerSales(userId!)

  return <DailyLogClient sales={sales} sellerId={userId!} />
}
