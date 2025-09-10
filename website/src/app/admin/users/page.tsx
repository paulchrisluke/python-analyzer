"use client"

import { RoleGuard } from "@/components/role-guard"
import { UserRole } from "@/lib/roles"
import { useState } from "react"

export default function AdminUsersPage() {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  return (
    <RoleGuard requiredRole={UserRole.ADMIN}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        {/* Action buttons and filters */}
        <div className="mb-6 flex gap-4 items-center">
          <button 
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
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
                  <td className="px-4 py-2">newadmin@example.com</td>
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
                      <div className="relative">
                        <button 
                          onClick={() => setShowActionMenu(!showActionMenu)}
                          className="text-gray-600 hover:text-gray-800"
                          aria-label="Open menu"
                        >
                          ⋮
                        </button>
                        {showActionMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Edit User
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Activate
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                      <div className="relative">
                        <button 
                          onClick={() => setShowActionMenu(!showActionMenu)}
                          className="text-gray-600 hover:text-gray-800"
                          aria-label="Open menu"
                        >
                          ⋮
                        </button>
                        {showActionMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Edit User
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Activate
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                      <div className="relative">
                        <button 
                          onClick={() => setShowActionMenu(!showActionMenu)}
                          className="text-gray-600 hover:text-gray-800"
                          aria-label="Open menu"
                        >
                          ⋮
                        </button>
                        {showActionMenu && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Edit User
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Activate
                              </button>
                              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                Delete User
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Dialog */}
        {showAddDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>
              <p className="text-gray-600 mb-4">Create a new user account with appropriate role and permissions.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full p-2 border rounded"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select className="w-full p-2 border rounded">
                    <option value="guest">Guest</option>
                    <option value="viewer">Viewer</option>
                    <option value="buyer">Buyer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
