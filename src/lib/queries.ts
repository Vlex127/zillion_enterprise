import { db, ensureDB } from "@/lib/db"

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
  inventoryType: "SERIALIZED" | "BULK"
  cost_price: number
  retail_price: number
  bulk_stock: number
  created_at: string
  updated_at: string
}

export type ProductItem = {
  id: string
  product_id: string
  imei: string | null
  status: "in_stock" | "sold"
  sale_id: string | null
  created_at: string
}

export type DashboardMetrics = {
  todayRevenue: number
  todayProfit: number
  cashTotal: number
  transferTotal: number
  posTotal: number
}

export async function getTodayMetrics(): Promise<DashboardMetrics> {
  await ensureDB()
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
  await ensureDB()
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
  await ensureDB()
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
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT * FROM products ORDER BY name ASC`,
  })
  return result.rows.map(mapProduct)
}

export async function getProduct(id: string): Promise<Product | null> {
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT * FROM products WHERE id = ?`,
    args: [id],
  })
  return result.rows[0] ? mapProduct(result.rows[0]) : null
}

export async function getProductItems(productId: string): Promise<ProductItem[]> {
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT * FROM product_items WHERE product_id = ? ORDER BY created_at DESC`,
    args: [productId],
  })
  return result.rows.map((r) => ({
    id: r.id as string,
    product_id: r.product_id as string,
    imei: (r.imei as string) ?? null,
    status: r.status as "in_stock" | "sold",
    sale_id: (r.sale_id as string) ?? null,
    created_at: r.created_at as string,
  }))
}

export async function createProduct(data: {
  name: string
  brand?: string
  category?: string
  inventoryType: "SERIALIZED" | "BULK"
  cost_price: number
  retail_price: number
  bulk_stock: number
  imeis?: string[]
}): Promise<Product> {
  await ensureDB()

  const isSerialized = data.inventoryType === "SERIALIZED"
  const stock = isSerialized ? (data.imeis?.length ?? 0) : data.bulk_stock

  const result = await db.execute({
    sql: `INSERT INTO products (name, brand, category, inventoryType, cost_price, retail_price, bulk_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      data.name,
      data.brand ?? null,
      data.category ?? null,
      data.inventoryType,
      data.cost_price,
      data.retail_price,
      stock,
    ],
  })
  const product = mapProduct(result.rows[0])

  if (isSerialized && data.imeis && data.imeis.length > 0) {
    const placeholders = data.imeis.map(() => "(?, ?, ?)").join(", ")
    const flatArgs: any[] = []
    for (const imei of data.imeis) {
      flatArgs.push(product.id, imei, "in_stock")
    }
    await db.execute({
      sql: `INSERT INTO product_items (product_id, imei, status) VALUES ${placeholders}`,
      args: flatArgs,
    })
  }

  return product
}

export async function updateProduct(
  id: string,
  data: {
    name?: string
    brand?: string
    category?: string
    inventoryType?: "SERIALIZED" | "BULK"
    cost_price?: number
    retail_price?: number
    bulk_stock?: number
    newImeis?: string[]
  }
): Promise<Product> {
  await ensureDB()
  const sets: string[] = []
  const args: any[] = []

  if (data.name !== undefined) { sets.push("name = ?"); args.push(data.name) }
  if (data.brand !== undefined) { sets.push("brand = ?"); args.push(data.brand) }
  if (data.category !== undefined) { sets.push("category = ?"); args.push(data.category) }
  if (data.inventoryType !== undefined) { sets.push("inventoryType = ?"); args.push(data.inventoryType) }
  if (data.cost_price !== undefined) { sets.push("cost_price = ?"); args.push(data.cost_price) }
  if (data.retail_price !== undefined) { sets.push("retail_price = ?"); args.push(data.retail_price) }
  if (data.bulk_stock !== undefined) { sets.push("bulk_stock = ?"); args.push(data.bulk_stock) }

  sets.push("updated_at = datetime('now')")

  const result = await db.execute({
    sql: `UPDATE products SET ${sets.join(", ")} WHERE id = ? RETURNING *`,
    args: [...args, id],
  })

  if (data.newImeis && data.newImeis.length > 0) {
    const placeholders = data.newImeis.map(() => "(?, ?, ?)").join(", ")
    const flatArgs: any[] = []
    for (const imei of data.newImeis) {
      flatArgs.push(id, imei, "in_stock")
    }
    await db.execute({
      sql: `INSERT INTO product_items (product_id, imei, status) VALUES ${placeholders}`,
      args: flatArgs,
    })

    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM product_items WHERE product_id = ? AND status = 'in_stock'`,
      args: [id],
    })
    const newCount = Number(countResult.rows[0]?.cnt ?? 0)
    await db.execute({
      sql: `UPDATE products SET bulk_stock = ? WHERE id = ?`,
      args: [newCount, id],
    })
  }

  return mapProduct(result.rows[0])
}

export async function createSale(data: {
  product_id: string
  seller_id: string
  quantity: number
  unit_price: number
  total: number
  cost_price: number
  profit: number
  payment_method: "cash" | "transfer" | "pos"
  item_ids?: string[]
}): Promise<void> {
  await ensureDB()

  const prodResult = await db.execute({
    sql: `SELECT inventoryType FROM products WHERE id = ?`,
    args: [data.product_id],
  })
  const inventoryType = prodResult.rows[0]?.inventoryType as string

  const result = await db.execute({
    sql: `INSERT INTO sales (product_id, seller_id, quantity, unit_price, total, cost_price, profit, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    args: [
      data.product_id,
      data.seller_id,
      data.quantity,
      data.unit_price,
      data.total,
      data.cost_price,
      data.profit,
      data.payment_method,
    ],
  })
  const saleId = result.rows[0].id as string

  if (inventoryType === "SERIALIZED") {
    const itemIds = data.item_ids && data.item_ids.length > 0
      ? data.item_ids
      : (await db.execute({
          sql: `SELECT id FROM product_items WHERE product_id = ? AND status = 'in_stock' ORDER BY created_at ASC LIMIT ?`,
          args: [data.product_id, data.quantity],
        })).rows.map((r) => r.id as string)

    if (itemIds.length > 0) {
      const placeholders = itemIds.map(() => "?").join(", ")
      await db.execute({
        sql: `UPDATE product_items SET status = 'sold', sale_id = ? WHERE id IN (${placeholders})`,
        args: [saleId, ...itemIds],
      })
    }

    await db.execute({
      sql: `UPDATE products SET bulk_stock = (
        SELECT COUNT(*) FROM product_items WHERE product_id = ? AND status = 'in_stock'
      ), updated_at = datetime('now') WHERE id = ?`,
      args: [data.product_id, data.product_id],
    })
  } else {
    await db.execute({
      sql: `UPDATE products SET bulk_stock = bulk_stock - ?, updated_at = datetime('now') WHERE id = ?`,
      args: [data.quantity, data.product_id],
    })
  }
}

export async function getAdminSellers(): Promise<{ id: string; name: string }[]> {
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT id, COALESCE(first_name || ' ' || last_name, email) as name FROM users WHERE role = 'seller' ORDER BY name`,
  })
  return result.rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
  }))
}

export async function getSellerSales(
  sellerId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Sale[]> {
  await ensureDB()
  const conditions: string[] = ["s.seller_id = ?"]
  const args: any[] = [sellerId]

  if (dateFrom) {
    conditions.push("date(s.created_at) >= ?")
    args.push(dateFrom)
  }
  if (dateTo) {
    conditions.push("date(s.created_at) <= ?")
    args.push(dateTo)
  }

  const where = `WHERE ${conditions.join(" AND ")}`

  const result = await db.execute({
    sql: `SELECT s.*, p.name as product_name,
      COALESCE(u.first_name || ' ' || u.last_name, u.email) as seller_name
    FROM sales s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN users u ON s.seller_id = u.id
    ${where}
    ORDER BY s.created_at DESC LIMIT 100`,
    args,
  })
  return result.rows.map(mapSale)
}

export type User = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: string
}

export async function getAllUsers(): Promise<User[]> {
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT * FROM users ORDER BY created_at DESC`,
  })
  return result.rows.map((r) => ({
    id: r.id as string,
    email: r.email as string,
    first_name: (r.first_name as string) ?? null,
    last_name: (r.last_name as string) ?? null,
    role: r.role as string,
    created_at: r.created_at as string,
  }))
}

export type DailyRevenue = {
  date: string
  revenue: number
  profit: number
}

export async function getRevenueHistory(days = 30): Promise<DailyRevenue[]> {
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT date(created_at) as date,
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(profit), 0) as profit
    FROM sales
    WHERE created_at >= datetime('now', ?)
    GROUP BY date(created_at)
    ORDER BY date ASC`,
    args: [`-${days} days`],
  })
  return result.rows.map((r) => ({
    date: r.date as string,
    revenue: Number(r.revenue),
    profit: Number(r.profit),
  }))
}

export type ProductSummary = {
  name: string
  total_qty: number
  total_revenue: number
}

export async function getTopProducts(limit = 10): Promise<ProductSummary[]> {
  await ensureDB()
  const result = await db.execute({
    sql: `SELECT p.name,
      SUM(s.quantity) as total_qty,
      SUM(s.total) as total_revenue
    FROM sales s
    JOIN products p ON s.product_id = p.id
    GROUP BY s.product_id
    ORDER BY total_revenue DESC
    LIMIT ?`,
    args: [limit],
  })
  return result.rows.map((r) => ({
    name: r.name as string,
    total_qty: Number(r.total_qty),
    total_revenue: Number(r.total_revenue),
  }))
}

function mapProduct(row: any): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    brand: (row.brand as string) ?? null,
    category: (row.category as string) ?? null,
    inventoryType: (row.inventoryType as "SERIALIZED" | "BULK") ?? "BULK",
    cost_price: Number(row.cost_price),
    retail_price: Number(row.retail_price),
    bulk_stock: Number(row.bulk_stock),
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
