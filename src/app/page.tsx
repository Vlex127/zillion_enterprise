import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const user = await currentUser()

  if (!user) {
    redirect("/login")
  }

  const role = user.publicMetadata.role as string | undefined

  if (role === "admin") {
    redirect("/admin/dashboard")
  }

  if (role === "seller") {
    redirect("/seller/pos")
  }

  redirect("/login")
}
