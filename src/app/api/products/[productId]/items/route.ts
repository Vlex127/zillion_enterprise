import { getProductItems } from "@/lib/queries"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const items = await getProductItems(productId)
  return NextResponse.json(items)
}
