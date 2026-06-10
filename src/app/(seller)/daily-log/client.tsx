"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"

type Sale = {
  id: string
  product_name: string
  quantity: number
  total: number
  profit: number
  payment_method: "cash" | "transfer" | "pos"
  created_at: string
}

function formatCurrency(n: number) {
  return `NGN ${n.toLocaleString()}`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function DailyLogClient({
  sales,
}: {
  sales: Sale[]
  sellerId: string
}) {
  const [filterDate, setFilterDate] = useState("")
  const [filterMethod, setFilterMethod] = useState("")

  const filteredSales = sales.filter((s) => {
    if (filterDate) {
      const saleDate = new Date(s.created_at).toISOString().split("T")[0]
      if (saleDate !== filterDate) return false
    }
    if (filterMethod && s.payment_method !== filterMethod) return false
    return true
  })

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0)

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Daily Log</h1>

      <div className="flex items-center gap-2 mb-4">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-40"
        />
        <Select value={filterMethod} onValueChange={(v) => setFilterMethod(v ?? "")}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="pos">POS</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto text-sm text-muted-foreground">
          Revenue: <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
          &ensp;Profit: <span className="font-semibold text-green-600">{formatCurrency(totalProfit)}</span>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No sales{filterDate || filterMethod ? " matching filters" : " yet"}
                </TableCell>
              </TableRow>
            )}
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(sale.created_at)}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {formatTime(sale.created_at)}
                </TableCell>
                <TableCell>{sale.product_name}</TableCell>
                <TableCell className="text-right">{sale.quantity}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(sale.total)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(sale.profit)}
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      sale.payment_method === "cash"
                        ? "bg-green-100 text-green-700"
                        : sale.payment_method === "transfer"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {sale.payment_method}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
