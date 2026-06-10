"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, ChevronDown, ChevronRight, Smartphone, Package } from "lucide-react"
import { useState } from "react"
import { addProduct, editProduct } from "@/lib/actions"

type Product = {
  id: string
  name: string
  brand: string | null
  category: string | null
  cost_price: number
  retail_price: number
  bulk_stock: number
  updated_at: string
}

function formatCurrency(n: number) {
  return `NGN ${n.toLocaleString()}`
}

export function ProductsClient({ products }: { products: Product[] }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editingProduct = editingId ? products.find((p) => p.id === editingId) ?? null : null
  const [editOpen, setEditOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [imeiList, setImeiList] = useState<Record<string, { imei: string; status: string }[]>>({})

  const isPhone = (cat: string | null) =>
    cat?.toLowerCase() === "phone" || cat?.toLowerCase() === "phones"

  async function toggleExpand(productId: string) {
    if (expandedId === productId) {
      setExpandedId(null)
      return
    }
    if (!imeiList[productId]) {
      const res = await fetch(`/api/products/${productId}/items`)
      const data = await res.json()
      setImeiList((prev) => ({ ...prev, [productId]: data }))
    }
    setExpandedId(productId)
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? "s" : ""} registered
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <form
            action={async (formData) => {
              await addProduct(formData)
              setAddOpen(false)
            }}
          >
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="name">Product Name *</FieldLabel>
                <Input id="name" name="name" required placeholder="e.g. iPhone 15 Pro" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="brand">Brand</FieldLabel>
                  <Input id="brand" name="brand" placeholder="e.g. Apple" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Input id="category" name="category" placeholder="e.g. Phone" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="cost_price">Cost Price (₦) *</FieldLabel>
                  <Input id="cost_price" name="cost_price" type="number" required min="0" step="0.01" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="retail_price">Retail Price (₦) *</FieldLabel>
                  <Input id="retail_price" name="retail_price" type="number" required min="0" step="0.01" />
                </Field>
              </div>
              <div
                data-category-watch
                className="grid grid-cols-1 gap-4"
              >
                <Field>
                  <FieldLabel htmlFor="bulk_stock">Stock Quantity</FieldLabel>
                  <Input
                    id="bulk_stock"
                    name="bulk_stock"
                    type="number"
                    min="0"
                    defaultValue="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For phones, use the field below instead — one IMEI per unit.
                  </p>
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="imeis">
                  IMEI Numbers
                  <span className="text-xs text-muted-foreground ml-2">
                    (one per line — for phones)
                  </span>
                </FieldLabel>
                <Textarea
                  id="imeis"
                  name="imeis"
                  rows={5}
                  placeholder="123456789012345&#10;987654321098765"
                  className="font-mono text-xs"
                />
              </Field>
              <Button type="submit" className="mt-2">Save Product</Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Retail</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No products yet. Add your first product.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const margin = product.retail_price - product.cost_price
              const marginPercent = product.cost_price > 0
                ? Math.round((margin / product.cost_price) * 100)
                : 0
              const expanded = expandedId === product.id
              const items = imeiList[product.id]

              return (
                <>
                  <TableRow key={product.id} className={expanded ? "border-b-0" : ""}>
                    <TableCell>
                      {isPhone(product.category) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => toggleExpand(product.id)}
                        >
                          {expanded
                            ? <ChevronDown className="size-3" />
                            : <ChevronRight className="size-3" />
                          }
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {isPhone(product.category)
                          ? <Smartphone className="size-3.5 text-muted-foreground" />
                          : <Package className="size-3.5 text-muted-foreground" />
                        }
                        {product.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge className="border text-xs">
                          {product.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                    <TableCell>{formatCurrency(product.retail_price)}</TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(margin)} ({marginPercent}%)
                    </TableCell>
                    <TableCell className="text-right">
                      {product.bulk_stock === 0 ? (
                        <span className="text-destructive font-semibold">0</span>
                      ) : product.bulk_stock < 5 ? (
                        <span className="text-amber-600 font-semibold">{product.bulk_stock}</span>
                      ) : (
                        <span>{product.bulk_stock}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingId(product.id)
                          setEditOpen(true)
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expanded && items && (
                    <TableRow key={`${product.id}-items`}>
                      <TableCell colSpan={8} className="bg-muted/30 p-0">
                        <div className="px-10 py-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            IMEI Inventory ({items.filter((i) => i.status === "in_stock").length} in stock,{" "}
                            {items.filter((i) => i.status === "sold").length} sold)
                          </p>
                          <div className="grid grid-cols-4 gap-1">
                            {items.map((item) => (
                              <span
                                key={item.imei}
                                className={`font-mono text-xs px-2 py-1 rounded ${
                                  item.status === "sold"
                                    ? "bg-muted text-muted-foreground line-through"
                                    : "bg-green-50 text-green-800"
                                }`}
                              >
                                {item.imei}
                              </span>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit {editingProduct?.name}</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form
              action={async (formData) => {
                await editProduct(editingProduct.id, formData)
                setEditOpen(false)
              }}
            >
              <FieldGroup className="gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Product Name</FieldLabel>
                  <Input id="name" name="name" defaultValue={editingProduct.name} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="brand">Brand</FieldLabel>
                    <Input id="brand" name="brand" defaultValue={editingProduct.brand ?? ""} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="category">Category</FieldLabel>
                    <Input id="category" name="category" defaultValue={editingProduct.category ?? ""} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="cost_price">Cost Price (₦)</FieldLabel>
                    <Input id="cost_price" name="cost_price" type="number" min="0" step="0.01" defaultValue={editingProduct.cost_price} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="retail_price">Retail Price (₦)</FieldLabel>
                    <Input id="retail_price" name="retail_price" type="number" min="0" step="0.01" defaultValue={editingProduct.retail_price} />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="imeis">
                    Add New IMEI Numbers
                    <span className="text-xs text-muted-foreground ml-2">
                      (one per line — existing stock unchanged)
                    </span>
                  </FieldLabel>
                  <Textarea
                    id="imeis"
                    name="imeis"
                    rows={4}
                    placeholder="123456789012345&#10;987654321098765"
                    className="font-mono text-xs"
                  />
                </Field>
                <Button type="submit" className="mt-2">Save Changes</Button>
              </FieldGroup>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
