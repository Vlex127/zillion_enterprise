"use server"

import { createProduct, updateProduct, createSale } from "@/lib/queries"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { setUserRole } from "@/lib/roles"

export async function addProduct(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    brand: (formData.get("brand") as string) || undefined,
    category: (formData.get("category") as string) || undefined,
    cost_price: parseFloat(formData.get("cost_price") as string),
    retail_price: parseFloat(formData.get("retail_price") as string),
    bulk_stock: parseInt(formData.get("bulk_stock") as string) || 0,
    imei: (formData.get("imei") as string) || undefined,
  }

  await createProduct(data)
  revalidatePath("/products")
}

export async function editProduct(id: string, formData: FormData) {
  const data: Record<string, string | number> = {}

  const name = formData.get("name") as string
  if (name) data.name = name

  const brand = formData.get("brand") as string
  if (brand) data.brand = brand

  const category = formData.get("category") as string
  if (category) data.category = category

  const cost_price = formData.get("cost_price") as string
  if (cost_price) data.cost_price = parseFloat(cost_price)

  const retail_price = formData.get("retail_price") as string
  if (retail_price) data.retail_price = parseFloat(retail_price)

  const bulk_stock = formData.get("bulk_stock") as string
  if (bulk_stock) data.bulk_stock = parseInt(bulk_stock)

  const imei = formData.get("imei") as string
  if (imei) data.imei = imei

  await updateProduct(id, data as any)
  revalidatePath("/products")
}

export async function recordSale(formData: FormData) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const product_id = formData.get("product_id") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const unit_price = parseFloat(formData.get("unit_price") as string)
  const cost_price = parseFloat(formData.get("cost_price") as string)
  const payment_method = formData.get("payment_method") as "cash" | "transfer" | "pos"

  const total = quantity * unit_price
  const profit = quantity * (unit_price - cost_price)

  await createSale({
    product_id,
    seller_id: userId,
    quantity,
    unit_price,
    total,
    cost_price: cost_price * quantity,
    profit,
    payment_method,
  })

  revalidatePath("/pos")
  revalidatePath("/daily-log")
  revalidatePath("/dashboard")
}

export async function changeUserRole(userId: string, role: "admin" | "seller") {
  await setUserRole(userId, role)
  revalidatePath("/staff")
}
