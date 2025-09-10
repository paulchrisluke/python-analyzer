import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/server-auth"

export default async function AdminPage() {
  // Server-side authorization check
  const session = await requireAdmin()
  
  if (!session) {
    // Redirect to home page if not authorized
    redirect("/")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        
               {/* Analytics Dashboard Section */}
               <div className="mb-8">
                 <h2 className="text-2xl font-semibold mb-4">Analytics Dashboard</h2>
                 
                 {/* Key Metrics */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
                     <p className="text-2xl font-bold">9</p>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Total Documents</h3>
                     <p className="text-2xl font-bold">0</p>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Avg Session Time</h3>
                     <p className="text-2xl font-bold">2.5m</p>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Document Downloads</h3>
                     <p className="text-2xl font-bold">0</p>
                   </div>
                 </div>
                 
                 {/* Analytics Sections */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="text-lg font-semibold mb-2">User Statistics</h3>
                     <p className="text-gray-600">Total users: 9</p>
                     <p className="text-gray-600">Active users: 9</p>
                     <p className="text-gray-600">Admin users: 2</p>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="text-lg font-semibold mb-2">Document Statistics</h3>
                     <p className="text-gray-600">Total documents: 0</p>
                     <p className="text-gray-600">Public documents: 0</p>
                     <p className="text-gray-600">Private documents: 0</p>
                   </div>
                 </div>
                 
                 {/* Role Statistics */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Administrator</h3>
                     <p className="text-2xl font-bold">2</p>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Qualified Buyer</h3>
                     <p className="text-2xl font-bold">1</p>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Viewer</h3>
                     <p className="text-2xl font-bold">1</p>
                   </div>
                   <div className="bg-white p-4 rounded-lg shadow">
                     <h3 className="text-sm font-medium text-gray-500">Guest</h3>
                     <p className="text-2xl font-bold">5</p>
                   </div>
                 </div>

                 {/* Additional Analytics Sections */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                   <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="text-lg font-semibold mb-2">Most Accessed Documents</h3>
                     <p className="text-gray-600">No documents available</p>
                   </div>
                   <div className="bg-white p-6 rounded-lg shadow">
                     <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
                     <p className="text-gray-600">No recent activity</p>
                   </div>
                 </div>
               </div>

        {/* Management Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="text-gray-600 mb-4">Manage user accounts and permissions</p>
            <a href="/admin/users" className="text-blue-600 hover:text-blue-800">
              Go to User Management →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <p className="text-gray-600 mb-4">View system analytics and reports</p>
            <a href="/admin/analytics" className="text-blue-600 hover:text-blue-800">
              View Analytics →
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            <p className="text-gray-600 mb-4">Configure system settings</p>
            <a href="/admin/settings" className="text-blue-600 hover:text-blue-800">
              Go to Settings →
            </a>
          </div>
        </div>
      </div>
  )
}
