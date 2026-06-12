"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { recordSale } from "@/lib/actions"
import { IMEIScanner } from "@/components/imei-scanner"
import { ShoppingCart, Barcode, Package, CheckCircle, XCircle, Loader2, ScanLine } from "lucide-react"
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

function formatCurrency(n: number) {
  return `NGN ${n.toLocaleString()}`
}

export function POSClient({
  products,
  sellerId,
}: {
  products: Product[]
  sellerId: string
}) {
  const router = useRouter()
  const [selectedProductId, setSelectedProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [imei, setImei] = useState("")
  const [imeiStatus, setImeiStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle")
  const [imeiItemId, setImeiItemId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const isSerialized = selectedProduct?.inventoryType === "SERIALIZED"

  const total = selectedProduct
    ? (isSerialized ? 1 : quantity) * selectedProduct.retail_price
    : 0
  const profit = selectedProduct
    ? (isSerialized ? 1 : quantity) * (selectedProduct.retail_price - selectedProduct.cost_price)
    : 0

  const canSubmit = selectedProduct && (
    isSerialized ? imeiStatus === "valid" : quantity > 0 && quantity <= selectedProduct.bulk_stock
  )

  async function checkImei(value: string) {
    if (value.length < 8) {
      setImeiStatus("idle")
      setImeiItemId("")
      return
    }
    setImeiStatus("checking")
    try {
      const res = await fetch(`/api/products/${selectedProductId}/lookup-imei?imei=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (data.found && data.status === "in_stock") {
        setImeiStatus("valid")
        setImeiItemId(data.id)
      } else {
        setImeiStatus(data.found && data.status === "sold" ? "invalid" : "invalid")
        setImeiItemId("")
      }
    } catch {
      setImeiStatus("invalid")
      setImeiItemId("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct || !canSubmit) return
    setSubmitting(true)

    const formData = new FormData()
    formData.set("product_id", selectedProduct.id)

    if (isSerialized) {
      formData.set("quantity", "1")
      formData.set("item_ids", imeiItemId)
    } else {
      formData.set("quantity", String(quantity))
    }

    formData.set("unit_price", String(selectedProduct.retail_price))
    formData.set("cost_price", String(selectedProduct.cost_price))
    formData.set("payment_method", paymentMethod)

    await recordSale(formData)
    setSubmitting(false)
    setDone(true)
    setTimeout(() => {
      setDone(false)
      setSelectedProductId("")
      setQuantity(1)
      setImei("")
      setImeiStatus("idle")
      setImeiItemId("")
      setPaymentMethod("cash")
      router.refresh()
    }, 1500)
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-80 text-center">
          <CardHeader>
            <CardTitle className="text-green-600">Sale Recorded!</CardTitle>
            <CardDescription>
              {formatCurrency(total)} — {paymentMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {selectedProduct?.name}
              {isSerialized ? ` — IMEI: ${imei}` : ` × ${quantity}`}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="size-5" />
        <h1 className="text-xl font-semibold">New Sale</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select Product</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="product">Product</FieldLabel>
                <Select value={selectedProductId} onValueChange={(v) => {
                  setSelectedProductId(v ?? "")
                  setQuantity(1)
                  setImei("")
                  setImeiStatus("idle")
                  setImeiItemId("")
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.bulk_stock === 0}>
                        <span className="flex items-center gap-2">
                          {p.inventoryType === "SERIALIZED"
                            ? <Barcode className="size-3.5" />
                            : <Package className="size-3.5" />
                          }
                          {p.name} ({p.brand ?? "No brand"}) — {p.bulk_stock} in stock
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedProduct && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="retail_price">Unit Price</FieldLabel>
                      <Input
                        id="retail_price"
                        value={formatCurrency(selectedProduct.retail_price)}
                        readOnly
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="cost_price">Cost Price</FieldLabel>
                      <Input
                        id="cost_price"
                        value={formatCurrency(selectedProduct.cost_price)}
                        readOnly
                      />
                    </Field>
                  </div>

                  {isSerialized ? (
                    <Field>
                      <FieldLabel htmlFor="imei">
                        <span className="flex items-center gap-2">
                          <Barcode className="size-3.5" />
                          IMEI Number
                        </span>
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          id="imei"
                          value={imei}
                          onChange={(e) => {
                            setImei(e.target.value)
                            checkImei(e.target.value)
                          }}
                          placeholder="Scan or type IMEI..."
                          className="font-mono pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2">
                          {imeiStatus === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                          {imeiStatus === "valid" && <CheckCircle className="size-4 text-green-600" />}
                          {imeiStatus === "invalid" && <XCircle className="size-4 text-destructive" />}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <IMEIScanner
                          onDetect={(value) => {
                            setImei(value)
                            checkImei(value)
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          or type manually
                        </span>
                      </div>
                      {imeiStatus === "valid" && (
                        <p className="text-xs text-green-600 mt-1">IMEI verified — in stock</p>
                      )}
                      {imeiStatus === "invalid" && (
                        <p className="text-xs text-destructive mt-1">IMEI not found or already sold</p>
                      )}
                      {selectedProduct.inventoryType === "SERIALIZED" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Quantity is always 1 for serialized items
                        </p>
                      )}
                    </Field>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={selectedProduct.bulk_stock}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                      {quantity > selectedProduct.bulk_stock && (
                        <p className="text-xs text-destructive mt-1">
                          Only {selectedProduct.bulk_stock} in stock
                        </p>
                      )}
                    </Field>
                  )}

                  <Field>
                    <FieldLabel htmlFor="payment_method">Payment Method</FieldLabel>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "cash")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="pos">POS</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}
            </FieldGroup>
          </CardContent>
          {selectedProduct && (
            <CardFooter className="flex flex-col items-stretch gap-4 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit</span>
                <span className="text-green-600 font-semibold">{formatCurrency(profit)}</span>
              </div>
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? "Recording..." : "Complete Sale"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  )
}
