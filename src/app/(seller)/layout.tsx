import { NavUser } from "@/components/nav-user"
import Link from "next/link"

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-6">
        <Link href="/pos" className="font-semibold text-sm">
          Zillion POS
        </Link>
        <nav className="flex items-center gap-4 ml-8 text-sm">
          <Link href="/pos" className="text-muted-foreground hover:text-foreground transition-colors">
            New Sale
          </Link>
          <Link href="/daily-log" className="text-muted-foreground hover:text-foreground transition-colors">
            Daily Log
          </Link>
        </nav>
        <div className="ml-auto">
          <NavUser standalone />
        </div>
      </header>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  )
}
