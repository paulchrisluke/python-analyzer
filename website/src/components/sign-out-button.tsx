import { LogOutIcon } from "lucide-react"
import Link from "next/link"

export function SignOutButton() {
  return (
    <Link href="/api/auth/signout" className="w-full text-left flex items-center gap-2">
      <LogOutIcon />
      Log out
    </Link>
  )
}
