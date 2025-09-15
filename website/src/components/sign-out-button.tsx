import { LogOutIcon } from "lucide-react"
import { signOutAction } from "@/lib/actions"

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button type="submit" className="w-full text-left">
        <LogOutIcon />
        Log out
      </button>
    </form>
  )
}
