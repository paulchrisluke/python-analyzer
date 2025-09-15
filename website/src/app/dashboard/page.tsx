"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push('/login')
      return
    }

    // Redirect based on user role
    const userRole = session.user?.role
    if (userRole === 'admin') {
      router.push('/admin')
    } else if (userRole === 'buyer') {
      router.push('/buyer')
    } else {
      // For viewers or any other roles, redirect to unauthorized
      router.push('/unauthorized')
    }
  }, [session, status, router])

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
