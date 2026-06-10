"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { changeUserRole } from "@/lib/actions"
import { useRouter } from "next/navigation"

type User = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: string
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function StaffClient({ users }: { users: User[] }) {
  const router = useRouter()

  const adminCount = users.filter((u) => u.role === "admin").length
  const sellerCount = users.filter((u) => u.role === "seller").length

  return (
    <div className="mt-4">
      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
        <span>{users.length} user{users.length !== 1 ? "s" : ""}</span>
        <span>{adminCount} admin{adminCount !== 1 ? "s" : ""}</span>
        <span>{sellerCount} seller{sellerCount !== 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No users found
                </TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={async (v) => {
                      if (v && v !== user.role) {
                        await changeUserRole(user.id, v as "admin" | "seller")
                        router.refresh()
                      }
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
