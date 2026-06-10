import { db } from "@/lib/db"

export type Sale = {
  id: string
  product_id: string
  seller_id: string
  seller_name: string
  quantity: number
  unit_price: number
  total: number
  cost_price: number
  profit: number
  payment_method: "cash" | "transfer" | "pos"
  created_at: string
  product_name: string
}

export type Product = {
  id: string
  name: string
  brand: string | null
  category: string | null
  cost_price: number
  retail_price: number
  bulk_stock: number
  imei: string | null
  created_at: string
  updated_at: string
}

export type DashboardMetrics = {
  todayRevenue: number
  todayProfit: number
  cashTotal: number
  transferTotal: number
  posTotal: number
}

export async function getTodayMetrics(): Promise<DashboardMetrics> {
  const today = new Date().toISOString().split("T")[0]
  const result = await db.execute({
    sql: `SELECT
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(profit), 0) as profit,
      COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash,
      COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer,
      COALESCE(SUM(CASE WHEN payment_method = 'pos' THEN total ELSE 0 END), 0) as pos
    FROM sales WHERE date(created_at) = ?`,
    args: [today],
  })
  const row = result.rows[0]
  return {
    todayRevenue: Number(row?.revenue ?? 0),
    todayProfit: Number(row?.profit ?? 0),
    cashTotal: Number(row?.cash ?? 0),
    transferTotal: Number(row?.transfer ?? 0),
    posTotal: Number(row?.pos ?? 0),
  }
}

export async function getLowStockProducts(): Promise<Product[]> {
  const result = await db.execute({
    sql: `SELECT * FROM products WHERE bulk_stock < 5 ORDER BY bulk_stock ASC LIMIT 10`,
  })
  return result.rows.map(mapProduct)
}

export async function getRecentSales(
  limit = 50,
  dateFrom?: string,
  dateTo?: string,
  paymentMethod?: string,
  sellerId?: string
): Promise<Sale[]> {
  const conditions: string[] = []
  const args: any[] = []

  if (dateFrom) {
    conditions.push("date(s.created_at) >= ?")
    args.push(dateFrom)
  }
  if (dateTo) {
    conditions.push("date(s.created_at) <= ?")
    args.push(dateTo)
  }
  if (paymentMethod) {
    conditions.push("s.payment_method = ?")
    args.push(paymentMethod)
  }
  if (sellerId) {
    conditions.push("s.seller_id = ?")
    args.push(sellerId)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  const result = await db.execute({
    sql: `SELECT s.*, p.name as product_name,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as seller_name
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.seller_id = u.id
    ${where}
    ORDER BY s.created_at DESC LIMIT ?`,
    args: [...args, limit],
  })
  return result.rows.map(mapSale)
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await db.execute({
    sql: `SELECT * FROM products ORDER BY name ASC`,
  })
  return result.rows.map(mapProduct)
}

export async function getProduct(id: string): Promise<Product | null> {
  const result = await db.execute({
    sql: `SELECT * FROM products WHERE id = ?`,
    args: [id],
  })
  return result.rows[0] ? mapProduct(result.rows[0]) : null
}

export async function createProduct(data: {
  name: string
  brand?: string
  category?: string
  cost_price: number
  retail_price: number
  bulk_stock: number
  imei?: string
}): Promise<Product> {
  const result = await db.execute({
    sql: `INSERT INTO products (name, brand, category, cost_price, retail_price, bulk_stock, imei)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      data.name,
      data.brand ?? null,
      data.category ?? null,
      data.cost_price,
      data.retail_price,
      data.bulk_stock,
      data.imei ?? null,
    ],
  })
  return mapProduct(result.rows[0])
}

export async function updateProduct(
  id: string,
  data: {
    name?: string
    brand?: string
    category?: string
    cost_price?: number
    retail_price?: number
    bulk_stock?: number
    imei?: string
  }
): Promise<Product> {
  const sets: string[] = []
  const args: any[] = []

  if (data.name !== undefined) { sets.push("name = ?"); args.push(data.name) }
  if (data.brand !== undefined) { sets.push("brand = ?"); args.push(data.brand) }
  if (data.category !== undefined) { sets.push("category = ?"); args.push(data.category) }
  if (data.cost_price !== undefined) { sets.push("cost_price = ?"); args.push(data.cost_price) }
  if (data.retail_price !== undefined) { sets.push("retail_price = ?"); args.push(data.retail_price) }
  if (data.bulk_stock !== undefined) { sets.push("bulk_stock = ?"); args.push(data.bulk_stock) }
  if (data.imei !== undefined) { sets.push("imei = ?"); args.push(data.imei) }

  sets.push("updated_at = datetime('now')")

  const result = await db.execute({
    sql: `UPDATE products SET ${sets.join(", ")} WHERE id = ? RETURNING *`,
    args: [...args, id],
  })
  return mapProduct(result.rows[0])
}

export async function getAdminSellers(): Promise<{ id: string; name: string }[]> {
  const result = await db.execute({
    sql: `SELECT id, COALESCE(first_name || ' ' || last_name, email) as name FROM users WHERE role = 'seller' ORDER BY name`,
  })
  return result.rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
  }))
}

function mapProduct(row: any): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    brand: (row.brand as string) ?? null,
    category: (row.category as string) ?? null,
    cost_price: Number(row.cost_price),
    retail_price: Number(row.retail_price),
    bulk_stock: Number(row.bulk_stock),
    imei: (row.imei as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }
}

function mapSale(row: any): Sale {
  return {
    id: row.id as string,
    product_id: row.product_id as string,
    seller_id: row.seller_id as string,
    seller_name: (row.seller_name as string) ?? "Unknown",
    quantity: Number(row.quantity),
    unit_price: Number(row.unit_price),
    total: Number(row.total),
    cost_price: Number(row.cost_price),
    profit: Number(row.profit),
    payment_method: row.payment_method as "cash" | "transfer" | "pos",
    created_at: row.created_at as string,
    product_name: (row.product_name as string) ?? "Unknown",
  }
}
