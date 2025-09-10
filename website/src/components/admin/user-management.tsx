"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontalIcon, PlusIcon, SearchIcon, UserIcon, ShieldIcon, EyeIcon, EditIcon, TrashIcon, LoaderIcon, AlertTriangleIcon } from "lucide-react"
import { UserRole, getRoleDisplayName, getRoleDescription } from "@/lib/roles"
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, type User, type CreateUserData } from "@/hooks/use-users"
import { toast } from "sonner"


export function UserManagement() {
  // API hooks
  const { data: users = [], isLoading, error } = useUsers()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole | "all">("all")
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null)

  // Form state for adding new user
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.VIEWER)
  const [newUserPassword, setNewUserPassword] = useState("")
  
  // Form state for editing user
  const [editUserName, setEditUserName] = useState("")
  const [editUserEmail, setEditUserEmail] = useState("")
  const [editUserRole, setEditUserRole] = useState<UserRole>(UserRole.VIEWER)
  
  // Form validation state
  const [formErrors, setFormErrors] = useState<{name?: string; email?: string}>({})
  const [editFormErrors, setEditFormErrors] = useState<{name?: string; email?: string}>({})

  // Form validation function for add user
  const validateForm = (): boolean => {
    const errors: {name?: string; email?: string} = {}
    
    // Validate name
    if (!newUserName.trim()) {
      errors.name = "Name is required"
    }
    
    // Validate email
    if (!newUserEmail.trim()) {
      errors.email = "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUserEmail)) {
        errors.email = "Invalid email format"
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Form validation function for edit user
  const validateEditForm = (): boolean => {
    const errors: {name?: string; email?: string} = {}
    
    // Validate name
    if (!editUserName.trim()) {
      errors.name = "Name is required"
    }
    
    // Validate email
    if (!editUserEmail.trim()) {
      errors.email = "Email is required"
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(editUserEmail)) {
        errors.email = "Invalid email format"
      }
    }
    
    setEditFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: { role: newRole }
      })
      toast.success("User role updated successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user role")
    }
  }

  const handleToggleActive = async (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!user) return

    try {
      await updateUserMutation.mutateAsync({
        id: userId,
        data: { isActive: !user.isActive }
      })
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user status")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (deleteConfirmUser?.id === userId) {
      try {
        await deleteUserMutation.mutateAsync(userId)
        toast.success("User deleted successfully")
        setDeleteConfirmUser(null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete user")
      }
    }
  }

  const handleCreateUser = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return
    }

    if (!newUserPassword) {
      toast.error("Password is required")
      return
    }

    try {
      const userData: CreateUserData = {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        password: newUserPassword
      }

      await createUserMutation.mutateAsync(userData)
      toast.success("User created successfully")
      
      // Reset form and errors
      setNewUserName("")
      setNewUserEmail("")
      setNewUserRole(UserRole.VIEWER)
      setNewUserPassword("")
      setFormErrors({})
      setIsAddUserOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user")
    }
  }

  const handleEditUser = async () => {
    if (!editingUser) return

    // Validate form before submission
    if (!validateEditForm()) {
      return
    }

    try {
      const updateData = {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole
      }

      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        data: updateData
      })
      toast.success("User updated successfully")
      
      // Reset form and close dialog
      resetEditForm()
      setEditingUser(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    }
  }

  const resetEditForm = () => {
    setEditUserName("")
    setEditUserEmail("")
    setEditUserRole(UserRole.VIEWER)
    setEditFormErrors({})
  }

  const handleEditUserOpen = (user: User) => {
    setEditingUser(user)
    setEditUserName(user.name)
    setEditUserEmail(user.email)
    setEditUserRole(user.role)
    setEditFormErrors({})
  }

  const handleEditUserCancel = () => {
    resetEditForm()
    setEditingUser(null)
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "destructive"
      case UserRole.BUYER:
        return "default"
      case UserRole.VIEWER:
        return "secondary"
      case UserRole.GUEST:
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusBadgeVariant = (isActive: boolean) => {
    return isActive ? "default" : "secondary"
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <LoaderIcon className="h-4 w-4 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <span>Failed to load users. Please try again.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with appropriate role and permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  placeholder="Enter full name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  onBlur={() => {
                    if (newUserName.trim()) {
                      setFormErrors(prev => ({ ...prev, name: undefined }))
                    }
                  }}
                  disabled={createUserMutation.isPending}
                  aria-invalid={!!formErrors.name}
                  className={formErrors.name ? "border-red-500 focus:border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500" role="alert">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email address"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  onBlur={() => {
                    if (newUserEmail.trim()) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      if (emailRegex.test(newUserEmail)) {
                        setFormErrors(prev => ({ ...prev, email: undefined }))
                      }
                    }
                  }}
                  disabled={createUserMutation.isPending}
                  aria-invalid={!!formErrors.email}
                  className={formErrors.email ? "border-red-500 focus:border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500" role="alert">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUserRole} 
                  onValueChange={(value) => setNewUserRole(value as UserRole)}
                  disabled={createUserMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(UserRole).map(role => (
                      <SelectItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsAddUserOpen(false)}
                disabled={createUserMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? (
                  <>
                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create User'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {Object.values(UserRole).map(role => (
                    <SelectItem key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`/avatars/${user.id}.jpg`} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.isActive)}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? (
                      <div className="text-sm">
                        {user.lastLoginAt.toLocaleDateString()}
                        <div className="text-muted-foreground">
                          {user.lastLoginAt.toLocaleTimeString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {user.createdAt.toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditUserOpen(user)}>
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleToggleActive(user.id)}
                          disabled={updateUserMutation.isPending}
                        >
                          <ShieldIcon className="mr-2 h-4 w-4" />
                          {user.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => setDeleteConfirmUser(user)}
                          className="text-destructive"
                          disabled={deleteUserMutation.isPending}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        {Object.values(UserRole).map(role => {
          const count = users.filter(user => user.role === role).length
          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {getRoleDisplayName(role)}
                </CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">
                  {getRoleDescription(role)}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirmUser?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmUser(null)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmUser && handleDeleteUser(deleteConfirmUser.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={handleEditUserCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input 
                id="edit-name" 
                placeholder="Enter full name"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                onBlur={() => {
                  if (editUserName.trim()) {
                    setEditFormErrors(prev => ({ ...prev, name: undefined }))
                  }
                }}
                disabled={updateUserMutation.isPending}
                aria-invalid={!!editFormErrors.name}
                className={editFormErrors.name ? "border-red-500 focus:border-red-500" : ""}
              />
              {editFormErrors.name && (
                <p className="text-sm text-red-500" role="alert">
                  {editFormErrors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input 
                id="edit-email" 
                type="email" 
                placeholder="Enter email address"
                value={editUserEmail}
                onChange={(e) => setEditUserEmail(e.target.value)}
                onBlur={() => {
                  if (editUserEmail.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (emailRegex.test(editUserEmail)) {
                      setEditFormErrors(prev => ({ ...prev, email: undefined }))
                    }
                  }
                }}
                disabled={updateUserMutation.isPending}
                aria-invalid={!!editFormErrors.email}
                className={editFormErrors.email ? "border-red-500 focus:border-red-500" : ""}
              />
              {editFormErrors.email && (
                <p className="text-sm text-red-500" role="alert">
                  {editFormErrors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={editUserRole} 
                onValueChange={(value) => setEditUserRole(value as UserRole)}
                disabled={updateUserMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map(role => (
                    <SelectItem key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleEditUserCancel}
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


