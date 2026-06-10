import { auth, currentUser } from "@clerk/nextjs/server";

export type UserRole = "admin" | "seller";

export async function getUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  if (!user) return null;
  return (user.publicMetadata.role as UserRole) ?? null;
}

export async function requireRole(role: UserRole) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();
  const userRole = await getUserRole();
  if (userRole !== role) {
    throw new Error("Unauthorized");
  }
}
