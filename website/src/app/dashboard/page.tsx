import { getServerUser } from "@/lib/auth-server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getServerUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Redirect based on user role
  if (user.role === 'admin') {
    redirect('/admin')
  } else if (user.role === 'buyer') {
    redirect('/buyer')
  } else {
    // For viewers or any other roles, redirect to unauthorized
    redirect('/unauthorized')
  }
}
