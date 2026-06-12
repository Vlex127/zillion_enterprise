"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { IMEIScanner } from "@/components/imei-scanner"
import { useState, useRef, useEffect } from "react"
import { recordSale } from "@/lib/actions"
import {
  ShoppingCart,
  Barcode,
  Package,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Minus,
  Plus,
  Banknote,
  Smartphone,
  CreditCard,
  ArrowRight,
  Trash2,
  ScanLine,
} from "lucide-react"
import { useRouter } from "next/navigation"

type Product = {
  id: string
  name: string
  brand: string | null
  inventoryType: "SERIALIZED" | "BULK"
  cost_price: number
  retail_price: number
  bulk_stock: number
}

type CartItem = {
  product: Product
  quantity: number
  imei?: string
  imeiItemId?: string
  imeiStatus?: "idle" | "checking" | "valid" | "invalid"
}

function formatCurrency(n: number) {
  return `NGN ${n.toLocaleString()}`
}

function PaymentButton({
  value,
  current,
  onClick,
  icon,
  label,
}: {
  value: string
  current: string
  onClick: (v: string) => void
  icon: React.ReactNode
  label: string
}) {
  const active = value === current
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-sm font-medium transition-all ${
        active
          ? "border-primary bg-primary/5 text-primary shadow-sm"
          : "border-transparent bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function POSClient({
  products,
}: {
  products: Product[]
  sellerId: string
}) {
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const serialized = filtered.filter((p) => p.inventoryType === "SERIALIZED")
  const bulk = filtered.filter((p) => p.inventoryType === "BULK")

  const cartTotal = cart.reduce((s, c) => s + c.quantity * c.product.retail_price, 0)
  const cartProfit = cart.reduce((s, c) => s + c.quantity * (c.product.retail_price - c.product.cost_price), 0)
  const canCheckout = cart.length > 0 && cart.every((c) =>
    c.product.inventoryType === "SERIALIZED" ? c.imeiStatus === "valid" : c.quantity > 0
  )

  function cartQty(productId: string) {
    return cart.reduce((s, c) => s + (c.product.id === productId ? c.quantity : 0), 0)
  }

  function availableStock(product: Product) {
    return product.bulk_stock - cartQty(product.id)
  }

  function addToCart(product: Product) {
    if (availableStock(product) <= 0) return

    if (product.inventoryType === "SERIALIZED") {
      setCart((prev) => [...prev, { product, quantity: 1 }])
    } else {
      const existing = cart.find((c) => c.product.id === product.id)
      if (existing) {
        setCart((prev) =>
          prev.map((c) =>
            c.product.id === product.id
              ? { ...c, quantity: Math.min(c.quantity + 1, product.bulk_stock) }
              : c
          )
        )
      } else {
        setCart((prev) => [...prev, { product, quantity: 1 }])
      }
    }
    setSearch("")
    searchRef.current?.focus()
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product.id !== productId) return c
          const next = c.quantity + delta
          if (next <= 0) return null
          return { ...c, quantity: Math.min(next, c.product.bulk_stock) }
        })
        .filter(Boolean) as CartItem[]
    )
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId))
  }

  function setCartImei(productId: string, imei: string, itemId: string, status: "idle" | "checking" | "valid" | "invalid") {
    setCart((prev) =>
      prev.map((c) =>
        c.product.id === productId ? { ...c, imei, imeiItemId: itemId, imeiStatus: status } : c
      )
    )
  }

  async function handleCheckout() {
    if (!canCheckout) return
    setSubmitting(true)

    try {
      for (const item of cart) {
        const formData = new FormData()
        formData.set("product_id", item.product.id)
        formData.set("unit_price", String(item.product.retail_price))
        formData.set("cost_price", String(item.product.cost_price))
        formData.set("payment_method", paymentMethod)

        if (item.product.inventoryType === "SERIALIZED") {
          formData.set("quantity", "1")
          formData.set("item_ids", item.imeiItemId ?? "")
        } else {
          formData.set("quantity", String(item.quantity))
        }

        await recordSale(formData)
      }

      setDone(true)
      setTimeout(() => {
        setDone(false)
        setCart([])
        setPaymentMethod("cash")
        router.refresh()
      }, 2000)
    } catch {
      // error handled by action
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (done) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCart([])
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [done])

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-4">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="size-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-600">Sale Complete!</h1>
          <p className="text-muted-foreground">
            {formatCurrency(cartTotal)} — {paymentMethod}
          </p>
          <p className="text-sm text-muted-foreground">
            {cart.map((c) => c.product.name).join(", ")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] gap-4">
      {/* ─── Left: Product Browser ─── */}
      <div className="flex w-full flex-col gap-3 overflow-hidden lg:w-1/2 xl:w-3/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or brand..."
            className="h-12 pl-10 pr-4 text-base"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {serialized.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Serialized — IMEI Tracked
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {serialized.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={availableStock(p) === 0}
                    className={`group relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                      p.bulk_stock === 0
                        ? "border-dashed border-muted-foreground/20 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Barcode className="size-4 text-muted-foreground" />
                      <span
                        className={`text-xs font-medium ${
                          availableStock(p) === 0
                            ? "text-destructive"
                            : availableStock(p) < 3
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {availableStock(p)} left
                      </span>
                    </div>
                    <span className="text-sm font-semibold leading-tight">{p.name}</span>
                    {p.brand && (
                      <span className="text-xs text-muted-foreground">{p.brand}</span>
                    )}
                    <span className="mt-1 text-base font-bold text-primary">
                      {formatCurrency(p.retail_price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {bulk.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bulk — Quantity Based
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {bulk.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={availableStock(p) === 0}
                    className={`group relative flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all ${
                      availableStock(p) === 0
                        ? "border-dashed border-muted-foreground/20 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Package className="size-4 text-muted-foreground" />
                      <span
                        className={`text-xs font-medium ${
                          availableStock(p) === 0
                            ? "text-destructive"
                            : availableStock(p) < 5
                            ? "text-amber-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {availableStock(p)} left
                      </span>
                    </div>
                    <span className="text-sm font-semibold leading-tight">{p.name}</span>
                    {p.brand && (
                      <span className="text-xs text-muted-foreground">{p.brand}</span>
                    )}
                    <span className="mt-1 text-base font-bold text-primary">
                      {formatCurrency(p.retail_price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {search && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="size-8 mb-2 opacity-40" />
              <p className="text-sm">No products match &ldquo;{search}&rdquo;</p>
            </div>
          )}

          {!search && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="size-8 mb-2 opacity-40" />
              <p className="text-sm">No products available</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: Cart & Checkout ─── */}
      <div className="hidden w-full flex-col rounded-xl border bg-card lg:flex lg:w-1/2 xl:w-2/5">
        {/* Cart header */}
        <div className="flex items-center gap-2 border-b px-5 py-4">
          <ShoppingCart className="size-5" />
          <span className="font-semibold">Cart</span>
          {cart.length > 0 && (
            <>
              <Badge className="ml-auto bg-secondary text-secondary-foreground">
                {cart.reduce((s, c) => s + c.quantity, 0)} item
                {cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? "s" : ""}
              </Badge>
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="size-10 mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Select products from the left</p>
            </div>
          )}

          {cart.map((item) => (
            <div
              key={item.product.id + (item.imei ?? "")}
              className="rounded-lg border bg-card p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  {item.product.brand && (
                    <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {item.product.inventoryType === "SERIALIZED" ? (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Input
                      value={item.imei ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setCartImei(item.product.id, v, "", v.length < 8 ? "idle" : "checking")
                        if (v.length >= 8) {
                          fetch(
                            `/api/products/${item.product.id}/lookup-imei?imei=${encodeURIComponent(v)}`
                          )
                            .then((r) => r.json())
                            .then((data) => {
                              if (data.found && data.status === "in_stock") {
                                setCartImei(item.product.id, v, data.id, "valid")
                              } else {
                                setCartImei(item.product.id, v, "", "invalid")
                              }
                            })
                            .catch(() => setCartImei(item.product.id, v, "", "invalid"))
                        }
                      }}
                      placeholder="Scan or type IMEI..."
                      className="font-mono text-xs h-9 pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      {item.imeiStatus === "checking" && (
                        <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                      )}
                      {item.imeiStatus === "valid" && (
                        <CheckCircle className="size-3.5 text-green-600" />
                      )}
                      {item.imeiStatus === "invalid" && (
                        <XCircle className="size-3.5 text-destructive" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <IMEIScanner
                      onDetect={(value) => {
                        setCartImei(item.product.id, value, "", "checking")
                        fetch(
                          `/api/products/${item.product.id}/lookup-imei?imei=${encodeURIComponent(value)}`
                        )
                          .then((r) => r.json())
                          .then((data) => {
                            if (data.found && data.status === "in_stock") {
                              setCartImei(item.product.id, value, data.id, "valid")
                            } else {
                              setCartImei(item.product.id, value, "", "invalid")
                            }
                          })
                          .catch(() => setCartImei(item.product.id, value, "", "invalid"))
                      }}
                    />
                    {item.imeiStatus === "valid" ? (
                      <span className="text-xs text-green-600">Verified</span>
                    ) : item.imeiStatus === "invalid" ? (
                      <span className="text-xs text-destructive">Invalid or sold</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">1 ×</span>
                    <span className="font-semibold">
                      {formatCurrency(item.product.retail_price)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      disabled={item.quantity <= 1}
                      className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="flex w-10 items-center justify-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.bulk_stock}
                      className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatCurrency(item.quantity * item.product.retail_price)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Checkout footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payment Method
              </p>
              <div className="grid grid-cols-3 gap-2">
                <PaymentButton
                  value="cash"
                  current={paymentMethod}
                  onClick={setPaymentMethod}
                  icon={<Banknote className="size-5" />}
                  label="Cash"
                />
                <PaymentButton
                  value="transfer"
                  current={paymentMethod}
                  onClick={setPaymentMethod}
                  icon={<Smartphone className="size-5" />}
                  label="Transfer"
                />
                <PaymentButton
                  value="pos"
                  current={paymentMethod}
                  onClick={setPaymentMethod}
                  icon={<CreditCard className="size-5" />}
                  label="POS"
                />
              </div>
            </div>

            <div className="space-y-1 rounded-lg bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(cartProfit)}
                </span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-base gap-2"
              disabled={!canCheckout || submitting}
              onClick={handleCheckout}
            >
              {submitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  Complete Sale
                  <ArrowRight className="size-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ─── Mobile bottom bar ─── */}
      <div className="fixed inset-x-0 bottom-0 border-t bg-card p-3 lg:hidden">
        {cart.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Select products to begin
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {cart.reduce((s, c) => s + c.quantity, 0)} item
                {cart.reduce((s, c) => s + c.quantity, 0) !== 1 ? "s" : ""}
              </p>
              <p className="text-lg font-bold">{formatCurrency(cartTotal)}</p>
            </div>
            <Button
              size="lg"
              disabled={!canCheckout || submitting}
              onClick={handleCheckout}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Complete Sale"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
