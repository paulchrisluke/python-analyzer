/**
 * Fetch wrapper that handles authentication errors gracefully
 * Redirects to login on 401, unauthorized page on 403
 * Always includes credentials to send session cookies
 */
export async function fetchWithAuth(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include", // Always include cookies for authentication
  })
  
  if (res.status === 401) {
    window.location.href = "/api/auth/signin"
    return
  }
  
  if (res.status === 403) {
    window.location.href = "/unauthorized"
    return
  }
  
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }
  
  return res.json()
}
