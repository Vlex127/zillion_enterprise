import { db, ensureDB } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params
  const imei = request.nextUrl.searchParams.get("imei")
  if (!imei) {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  await ensureDB()
  const result = await db.execute({
    sql: `SELECT id, status FROM product_items WHERE product_id = ? AND imei = ?`,
    args: [productId, imei],
  })

  if (result.rows.length === 0) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({
    found: true,
    id: result.rows[0].id as string,
    status: result.rows[0].status as string,
  })
}
