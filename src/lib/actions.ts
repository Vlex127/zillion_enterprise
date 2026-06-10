"use server"

import { createProduct, updateProduct, createSale } from "@/lib/queries"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { setUserRole } from "@/lib/roles"

export async function addProduct(formData: FormData) {
  const inventoryType = (formData.get("inventoryType") as string) || "BULK"
  const isSerialized = inventoryType === "SERIALIZED"

  const imeisRaw = (formData.get("imeis") as string) || ""
  const imeis = imeisRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  const data: {
    name: string
    brand?: string
    category?: string
    inventoryType: "SERIALIZED" | "BULK"
    cost_price: number
    retail_price: number
    bulk_stock: number
    imeis?: string[]
  } = {
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || undefined,
    category: (formData.get("category") as string) || undefined,
    inventoryType: inventoryType as "SERIALIZED" | "BULK",
    cost_price: parseFloat(formData.get("cost_price") as string),
    retail_price: parseFloat(formData.get("retail_price") as string),
    bulk_stock: parseInt(formData.get("bulk_stock") as string) || 0,
  }

  if (isSerialized) {
    data.imeis = imeis
  }

  await createProduct(data)
  revalidatePath("/products")
  revalidatePath("/dashboard")
}

export async function editProduct(id: string, formData: FormData) {
  const data: Record<string, string | number | string[]> = {}

  const name = formData.get("name") as string
  if (name) data.name = name

  const brand = formData.get("brand") as string
  if (brand !== undefined) data.brand = brand

  const category = formData.get("category") as string
  if (category !== undefined) data.category = category

  const inventoryType = formData.get("inventoryType") as string
  if (inventoryType === "SERIALIZED" || inventoryType === "BULK") {
    data.inventoryType = inventoryType
  }

  const cost_price = formData.get("cost_price") as string
  if (cost_price) data.cost_price = parseFloat(cost_price)

  const retail_price = formData.get("retail_price") as string
  if (retail_price) data.retail_price = parseFloat(retail_price)

  const bulk_stock = formData.get("bulk_stock") as string
  if (bulk_stock) data.bulk_stock = parseInt(bulk_stock)

  const imeisRaw = (formData.get("imeis") as string) || ""
  const imeis = imeisRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)

  if (imeis.length > 0) {
    data.newImeis = imeis
  }

  await updateProduct(id, data as any)
  revalidatePath("/products")
  revalidatePath("/dashboard")
}

export async function recordSale(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const product_id = formData.get("product_id") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const unit_price = parseFloat(formData.get("unit_price") as string)
  const cost_price = parseFloat(formData.get("cost_price") as string)
  const payment_method = formData.get("payment_method") as "cash" | "transfer" | "pos"
  const imei = (formData.get("imei") as string) || ""
  const item_ids_raw = (formData.get("item_ids") as string) || ""

  const total = quantity * unit_price
  const profit = quantity * (unit_price - cost_price)

  const saleData: {
    product_id: string
    seller_id: string
    quantity: number
    unit_price: number
    total: number
    cost_price: number
    profit: number
    payment_method: "cash" | "transfer" | "pos"
    item_ids?: string[]
  } = {
    product_id,
    seller_id: userId,
    quantity,
    unit_price,
    total,
    cost_price: cost_price * quantity,
    profit,
    payment_method,
  }

  if (item_ids_raw) {
    saleData.item_ids = item_ids_raw.split(",").filter(Boolean)
  }

  await createSale(saleData)
  revalidatePath("/pos")
  revalidatePath("/daily-log")
  revalidatePath("/dashboard")
  revalidatePath("/products")
  revalidatePath("/analytics")
}

export async function changeUserRole(userId: string, role: "admin" | "seller") {
  await setUserRole(userId, role)
  revalidatePath("/staff")
}
