"use server"

import { signOut } from "@/auth"
import { redirect } from "next/navigation"

export async function signOutAction() {
  // Prevent Auth.js from handling redirects
  await signOut({ redirect: false })

  // Redirect to signin page to force a new navigation and sidebar re-render
  redirect("/api/auth/signin")
}
