import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserRole } from '@/lib/roles'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  name: string
  email: string
  role: UserRole
  password: string
}

export interface UpdateUserData {
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

// Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    },
  })
}

// Create a new user
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: CreateUserData): Promise<User> => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Update a user
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }): Promise<User> => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Delete a user
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
