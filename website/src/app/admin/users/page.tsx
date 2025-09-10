import { RoleGuard } from "@/components/role-guard"
import { UserRole, getRoleDisplayName } from "@/lib/roles"
import { db } from "@/lib/server/db"
import { schema } from "../../../../db/schema"
import { count } from "drizzle-orm"
import { UserManagement } from "@/components/admin/user-management"

async function getUserRoleCounts() {
  try {
    // Query to get counts by role
    const roleCounts = await db
      .select({
        role: schema.users.role,
        count: count()
      })
      .from(schema.users)
      .groupBy(schema.users.role)

    // Convert to a map for easy lookup
    const countsMap: Record<string, number> = {}
    roleCounts.forEach(({ role, count: roleCount }) => {
      if (role) {
        countsMap[role] = roleCount
      }
    })

    // Ensure all roles have a count (default to 0 if missing)
    const allRoles = [UserRole.ADMIN, UserRole.BUYER, UserRole.VIEWER, UserRole.GUEST]
    const result: Record<string, number> = {}
    
    allRoles.forEach(role => {
      result[getRoleDisplayName(role)] = countsMap[role] || 0
    })

    return result
  } catch (error) {
    console.error("Error fetching user role counts:", error)
    // Return default counts on error
    return {
      [getRoleDisplayName(UserRole.ADMIN)]: 0,
      [getRoleDisplayName(UserRole.BUYER)]: 0,
      [getRoleDisplayName(UserRole.VIEWER)]: 0,
      [getRoleDisplayName(UserRole.GUEST)]: 0,
    }
  }
}

export default async function AdminUsersPage() {
  const roleCounts = await getUserRoleCounts()
  return (
    <RoleGuard requiredRole={UserRole.ADMIN}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        
        
        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Administrator</h3>
            <p className="text-2xl font-bold">{roleCounts[getRoleDisplayName(UserRole.ADMIN)]}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Qualified Buyer</h3>
            <p className="text-2xl font-bold">{roleCounts[getRoleDisplayName(UserRole.BUYER)]}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Viewer</h3>
            <p className="text-2xl font-bold">{roleCounts[getRoleDisplayName(UserRole.VIEWER)]}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Guest</h3>
            <p className="text-2xl font-bold">{roleCounts[getRoleDisplayName(UserRole.GUEST)]}</p>
          </div>
        </div>

        <UserManagement />
      </div>
    </RoleGuard>
  )
}

