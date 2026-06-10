import { getAllProducts } from "@/lib/queries"
import { auth } from "@clerk/nextjs/server"
import { POSClient } from "./client"

export default async function POSPage() {
  const { userId } = await auth()
  const products = await getAllProducts()

  return <POSClient products={products} sellerId={userId!} />
}
