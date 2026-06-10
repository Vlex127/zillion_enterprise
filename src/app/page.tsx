import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserRole } from "@/lib/roles"

export default async function Home() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const role = await getUserRole(userId)

  if (role === "admin") {
    redirect("/dashboard")
  }

  if (role === "seller") {
    redirect("/pos")
  }

  redirect("/login")
}
