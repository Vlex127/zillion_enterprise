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
import { Plus, Pencil } from "lucide-react"
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
  imei: string | null
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
        <DialogContent className="sm:max-w-lg">
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
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="bulk_stock">Stock Quantity</FieldLabel>
                  <Input id="bulk_stock" name="bulk_stock" type="number" min="0" defaultValue="0" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="imei">IMEI (for phones)</FieldLabel>
                  <Input id="imei" name="imei" placeholder="e.g. 123456789012345" />
                </Field>
              </div>
              <Button type="submit" className="mt-2">Save Product</Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Brand</TableHead>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No products yet. Add your first product.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const margin = product.retail_price - product.cost_price
              const marginPercent = product.cost_price > 0
                ? Math.round((margin / product.cost_price) * 100)
                : 0
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.brand ?? "—"}</TableCell>
                  <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                  <TableCell>{formatCurrency(product.retail_price)}</TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(margin)} ({marginPercent}%)
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={product.bulk_stock < 5 ? "text-amber-600 font-semibold" : ""}>
                      {product.bulk_stock}
                    </span>
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
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
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
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="bulk_stock">Stock Quantity</FieldLabel>
                    <Input id="bulk_stock" name="bulk_stock" type="number" min="0" defaultValue={editingProduct.bulk_stock} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="imei">IMEI</FieldLabel>
                    <Input id="imei" name="imei" defaultValue={editingProduct.imei ?? ""} />
                  </Field>
                </div>
                <Button type="submit" className="mt-2">Save Changes</Button>
              </FieldGroup>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
