import { getUserRole, type UserRole } from "@/lib/roles";
import { auth } from "@clerk/nextjs/server";

export { type UserRole } from "@/lib/roles";

export async function requireRole(role: UserRole) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  const userRole = await getUserRole(userId);
  if (userRole !== role) {
    throw new Error("Unauthorized");
  }
}
