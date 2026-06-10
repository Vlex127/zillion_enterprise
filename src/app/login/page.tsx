import { LoginForm } from "@/components/login-form"
import { SignOutButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

export default async function LoginPage() {
  const { userId } = await auth()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      {userId && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Signed in —</span>
          <SignOutButton>
            <button className="underline hover:text-foreground transition-colors">
              Sign out
            </button>
          </SignOutButton>
        </div>
      )}
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
