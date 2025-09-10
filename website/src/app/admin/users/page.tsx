import { RoleGuard } from "@/components/role-guard"
import { UserRole } from "@/lib/roles"

export default function AdminUsersPage() {
  return (
    <RoleGuard requiredRole={UserRole.ADMIN}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        {/* Action buttons and filters */}
        <div className="mb-6 flex gap-4 items-center">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Add User
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Filters:</span>
            <select className="border rounded px-3 py-1">
              <option>All Roles</option>
              <option>Admin</option>
              <option>Buyer</option>
              <option>Viewer</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            className="ml-4 p-2 border rounded flex-1 max-w-md"
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2">System Administrator</td>
                  <td className="px-4 py-2">newadmin@cranberryhearing.com</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      Administrator
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800 mr-2">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800"
                        aria-label="Open menu"
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Sarah Buyer</td>
                  <td className="px-4 py-2">sarah@example.com</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Buyer
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800 mr-2">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800"
                        aria-label="Open menu"
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">Mike Viewer</td>
                  <td className="px-4 py-2">mike@example.com</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      Viewer
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800 mr-2">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        Delete
                      </button>
                      <button 
                        className="text-gray-600 hover:text-gray-800"
                        aria-label="Open menu"
                      >
                        ⋮
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
