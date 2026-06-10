import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function LoginSSOCallbackPage() {
  return (
    <AuthenticateWithRedirectCallback
      signInUrl="/login"
      signUpUrl="/signup"
    />
  )
}
