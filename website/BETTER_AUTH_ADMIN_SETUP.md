# Better-Auth Admin Plugin Setup

This document describes the setup of Better-Auth with the Admin plugin for role-based access control.

## 1. Better-Auth Setup

### Installation
Better-Auth is already installed in this project. The Admin plugin is configured in `src/auth.ts`.

### Configuration
The auth configuration includes:
- **Admin plugin** with configurable admin emails
- **User model** with `role` field (default: "user")
- **Database schema** updated to include role field

### Database Schema
The `users` table now includes a `role` field:
```sql
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;
```

## 2. Admin Plugin Configuration

Based on [Better-Auth Admin Plugin docs](https://www.better-auth.com/docs/plugins/admin), the plugin is configured with:

```typescript
plugins: [
  {
    id: "admin",
    config: {
      adminEmails: ["admin@cranberryhearing.com"], // Add admin emails here
    }
  }
]
```

## 3. Creating Admin Users

### Method 1: Using the Admin API
Use the script `scripts/create-admin-user.mjs`:

```bash
node scripts/create-admin-user.mjs
```

### Method 2: Direct API Call
```bash
curl -X POST http://localhost:3000/api/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cranberryhearing.com",
    "password": "admin123!",
    "name": "Admin User"
  }'
```

### Method 3: Better-Auth Admin API
Based on [Better-Auth Admin API docs](https://www.better-auth.com/docs/plugins/admin#api):

```typescript
// Create user with admin role
const result = await auth.api.signUpEmail({
  body: {
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    role: "admin"
  }
});
```

## 4. Role-Based Access Control

### AdminGuard Component
The `AdminGuard` component protects admin-only pages:

```typescript
import { AdminGuard } from "@/components/admin-guard";

export default function AdminPage() {
  return (
    <AdminGuard>
      {/* Admin-only content */}
    </AdminGuard>
  );
}
```

### Role Checking
Check user role in components:

```typescript
const { data: session } = useSession();
const isAdmin = session?.user?.role === "admin";
```

## 5. Playwright Tests

### Test Utilities
The `tests/utils/auth.ts` file provides utilities for testing:

- `loginAs(role: "user" | "admin")` - Login with specific role
- `createTestUser(role)` - Create test users
- `logout()` - Clear authentication
- `isAuthenticated()` - Check auth status

### Test Credentials
```typescript
const TEST_USERS = {
  user: {
    email: 'testuser@example.com',
    password: 'testpass123!',
    name: 'Test User',
    role: 'user'
  },
  admin: {
    email: 'admin@cranberryhearing.com',
    password: 'admin123!',
    name: 'Admin User',
    role: 'admin'
  }
};
```

### Running Tests
```bash
# Run all role-based access tests
npx playwright test tests/role-based-access.spec.ts

# Run with UI
npx playwright test tests/role-based-access.spec.ts --ui

# Run headed (see browser)
npx playwright test tests/role-based-access.spec.ts --headed
```

## 6. Test Coverage

The tests verify:

1. **User role cannot access admin page** - Expects redirect to login or access denied
2. **Admin role can access admin page** - Expects admin dashboard content
3. **Unauthenticated user cannot access admin page** - Expects redirect to login
4. **Admin user can access regular pages** - Verifies normal access
5. **User role can access regular pages** - Verifies normal access
6. **Role-based navigation works correctly** - Tests both roles

## 7. API Endpoints

### Authentication
- `POST /api/auth/sign-in/email` - Login
- `POST /api/auth/sign-up/email` - Register
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session

### Admin
- `POST /api/admin/create-admin` - Create admin user

## 8. Environment Variables

Required environment variables:
- `BETTER_AUTH_SECRET` - Secret key for Better-Auth
- `BETTER_AUTH_URL` - Base URL for Better-Auth
- `NODE_ENV` - Environment (development/production)

## 9. Development Workflow

1. Start the Next.js app: `npm run dev`
2. Start the Wrangler worker: `wrangler dev`
3. Create admin user: `node scripts/create-admin-user.mjs`
4. Run tests: `npx playwright test tests/role-based-access.spec.ts`

## 10. Production Considerations

- Set `requireEmailVerification: true` in production
- Use secure cookies in production
- Configure proper CORS settings
- Set up proper admin email validation
- Use environment-specific admin emails
