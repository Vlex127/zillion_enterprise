import { db, ensureDB } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export type UserRole = "admin" | "seller";

export async function getUserRole(userId: string): Promise<UserRole | null> {
  await ensureDB()
  const result = await db.execute({
    sql: "SELECT role FROM users WHERE id = ?",
    args: [userId],
  });
  if (result.rows.length === 0) return null;
  return (result.rows[0].role as UserRole) ?? null;
}

export async function setUserRole(userId: string, role: UserRole) {
  await ensureDB()
  await db.execute({
    sql: "UPDATE users SET role = ? WHERE id = ?",
    args: [role, userId],
  });
}

export async function requireRole(role: UserRole) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  const userRole = await getUserRole(userId);
  if (userRole !== role) {
    throw new Error("Unauthorized");
  }
}
