import { lookupIMEI } from "@/lib/queries"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const imei = request.nextUrl.searchParams.get("imei")
  if (!imei) {
    return NextResponse.json({ found: false }, { status: 400 })
  }

  const result = await lookupIMEI(imei)

  if (!result) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({
    found: true,
    itemId: result.itemId,
    product: result.product,
  })
}
