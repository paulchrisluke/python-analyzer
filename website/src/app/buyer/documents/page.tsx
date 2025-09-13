"use client"

import { useAuth } from "@/lib/simple-auth"

export default function BuyerDocuments() {
  const { user, signOut } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Hello World</h1>
        <p className="text-lg text-gray-600 mb-8">Documents page - Welcome, {user.name}!</p>
        <button 
          onClick={signOut}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}