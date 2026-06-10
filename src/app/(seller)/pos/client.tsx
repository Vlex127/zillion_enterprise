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
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { recordSale } from "@/lib/actions"
import { ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"

type Product = {
  id: string
  name: string
  brand: string | null
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
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const total = selectedProduct ? quantity * selectedProduct.retail_price : 0
  const profit = selectedProduct
    ? quantity * (selectedProduct.retail_price - selectedProduct.cost_price)
    : 0

  const inStock = selectedProduct ? quantity <= selectedProduct.bulk_stock : false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct || !inStock) return
    setSubmitting(true)

    const formData = new FormData()
    formData.set("product_id", selectedProduct.id)
    formData.set("quantity", String(quantity))
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
              {selectedProduct?.name} &times; {quantity}
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
                <Select value={selectedProductId} onValueChange={(v) => { setSelectedProductId(v ?? ""); setQuantity(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={p.bulk_stock === 0}>
                        {p.name} ({p.brand ?? "No brand"}) — {p.bulk_stock} in stock
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
                    {!inStock && (
                      <p className="text-xs text-destructive mt-1">
                        Only {selectedProduct.bulk_stock} in stock
                      </p>
                    )}
                  </Field>

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
              <Button type="submit" disabled={!inStock || submitting}>
                {submitting ? "Recording..." : "Complete Sale"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  )
}
