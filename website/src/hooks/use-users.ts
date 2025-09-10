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

// Raw API response interface (with string dates)
interface ApiUserResponse {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: string | null
  createdAt: string
  updatedAt: string
}

// Transform API response to User object with proper Date objects
function transformApiUser(apiUser: ApiUserResponse): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    role: apiUser.role,
    isActive: apiUser.isActive,
    lastLoginAt: apiUser.lastLoginAt ? new Date(apiUser.lastLoginAt) : undefined,
    createdAt: new Date(apiUser.createdAt),
    updatedAt: new Date(apiUser.updatedAt),
  }
}

// Safely handle error responses that might be JSON or plain text
async function handleErrorResponse(response: Response, defaultMessage: string): Promise<never> {
  let errorMessage = defaultMessage
  
  try {
    const errorData = await response.json()
    errorMessage = errorData.error || defaultMessage
  } catch {
    // If JSON parsing fails, try to get the response as text
    try {
      const errorText = await response.text()
      errorMessage = errorText || defaultMessage
    } catch {
      // If both fail, use the default message
    }
  }
  
  throw new Error(`HTTP ${response.status}: ${errorMessage}`)
}

// Safely parse JSON response with fallback to text
async function safeParseJsonResponse<T>(response: Response, errorMessage: string): Promise<T> {
  try {
    return await response.json()
  } catch {
    // If JSON parsing fails, try to get the response as text
    try {
      const text = await response.text()
      throw new Error(text || response.statusText || errorMessage)
    } catch (textError) {
      // If text parsing also fails, throw with the best available message
      throw new Error(response.statusText || errorMessage)
    }
  }
}

// Fetch all users
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch('/api/users')
      if (!response.ok) {
        await handleErrorResponse(response, 'Failed to fetch users')
      }
      const apiUsers: ApiUserResponse[] = await safeParseJsonResponse(response, 'Failed to fetch users')
      return apiUsers.map(transformApiUser)
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
        await handleErrorResponse(response, 'Failed to create user')
      }

      const apiUser: ApiUserResponse = await safeParseJsonResponse(response, 'Failed to create user')
      return transformApiUser(apiUser)
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
        await handleErrorResponse(response, 'Failed to update user')
      }

      const apiUser: ApiUserResponse = await safeParseJsonResponse(response, 'Failed to update user')
      return transformApiUser(apiUser)
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
        await handleErrorResponse(response, 'Failed to delete user')
      }
    },
    onSuccess: () => {
      // Invalidate and refetch users
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
