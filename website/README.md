# Cranberry Hearing & Balance Center - Business Sale Website

A modern Next.js application for the Cranberry Hearing & Balance Center business sale, featuring Google OAuth authentication with role-based access control and comprehensive business data presentation.

## 🚀 Features

- **Google OAuth Authentication**: Secure authentication using Auth.js v5 with Google OAuth
- **Role-Based Access Control**: Admin, buyer, and viewer roles with environment-based configuration
- **Protected Routes**: Role-based access to admin dashboard, buyer dashboard, and documents
- **ETL Data Integration**: Real-time business metrics from ETL pipeline
- **Modern UI**: Clean, responsive design with Tailwind CSS and shadcn/ui
- **Static Generation**: Optimized Next.js build with static page generation

## 📁 Project Structure

```
website/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout with AuthProvider
│   │   ├── page.tsx      # Landing page
│   │   ├── login/        # Login page
│   │   ├── dashboard/    # Admin dashboard
│   │   └── docs/         # Protected documents
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── login-form.tsx
│   │   ├── auth-guard.tsx
│   │   └── ...           # Other components
│   ├── lib/
│   │   ├── simple-auth.tsx # Simple authentication system
│   │   ├── etl-data.ts   # ETL pipeline data integration
│   │   └── utils.ts      # Utility functions
│   └── data/             # ETL-generated JSON data files
│       ├── landing_page_data.json
│       ├── financial_summary.json
│       └── equipment_analysis.json
├── tests/
│   └── auth.spec.ts      # Authentication tests
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the environment template
   cp env.example .env.local
   
   # Edit .env.local with your configuration (server-only variables)
   # GOOGLE_CLIENT_ID=your-google-oauth-client-id
   # GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   # NEXTAUTH_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
   # NEXTAUTH_URL=http://localhost:3000
   # ADMIN_EMAILS=admin@example.com,admin2@example.com
   # BUYER_EMAILS=buyer@example.com,investor@example.com
   ```
   
   **Security Note**: Never expose OAuth secrets or admin emails via NEXT_PUBLIC_* variables. Use Vercel secrets for production deployment.

## 🚀 Development

### Local Development

```bash
# Start local development server
npm run dev
```

The application will be available at `http://localhost:3000`

### ETL Data Integration

The website automatically integrates with the ETL pipeline data:

1. **Data Files**: JSON files are copied from the ETL pipeline to `src/data/` during CI/CD
2. **Data Loading**: The `src/lib/etl-data.ts` module loads and processes the data
3. **Real-time Metrics**: Business metrics, financial data, and equipment information are displayed dynamically

**Note**: For local development, ensure the ETL pipeline has run and copied data files to `src/data/`, or the build will fail due to missing JSON imports.

### Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed
```

## 📦 Deployment

This is a standard Next.js application that can be deployed to any hosting platform that supports Next.js.

### Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Deployment Options

- **Vercel**: Recommended for Next.js applications
- **Netlify**: Static site generation support
- **Cloudflare Pages**: Static site hosting
- **Any Node.js hosting**: Standard Next.js deployment

### Environment Configuration

#### Required Environment Variables

- **GOOGLE_CLIENT_ID**: Google OAuth client ID (server-only)
- **GOOGLE_CLIENT_SECRET**: Google OAuth client secret (server-only)
- **NEXTAUTH_SECRET**: JWT signing secret (minimum 32 characters, server-only)
- **NEXTAUTH_URL**: Application URL (http://localhost:3000 for dev, production URL for prod)
- **ADMIN_EMAILS**: Comma-separated list of admin email addresses (server-only)
- **BUYER_EMAILS**: Comma-separated list of buyer email addresses (server-only)
- **NEXT_PUBLIC_APP_URL**: Base URL for the application (default: http://localhost:3000)
- **NODE_ENV**: Environment (development/production)

**Security Implementation**: All OAuth credentials and email allowlists are server-only variables. Never expose these via NEXT_PUBLIC_* variables.

#### Example Environment File

```bash
# Google OAuth Configuration (Server-only variables)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NEXTAUTH_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
NEXTAUTH_URL=http://localhost:3000

# Role Configuration (Server-only variables)
ADMIN_EMAILS=admin@example.com,admin2@example.com
BUYER_EMAILS=buyer@example.com,investor@example.com

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

⚠️ **Security Note**: In production, use Vercel secrets or similar secure environment variable management. Never expose OAuth credentials or email allowlists via NEXT_PUBLIC_* variables.

## 🔐 Authentication Flow

### Google OAuth Authentication

- **Auth.js v5**: Modern authentication library with Google OAuth provider
- **Role-Based Access**: Admin, buyer, and viewer roles determined by email allowlist
- **Session Management**: JWT-based sessions with 7-day expiration
- **Protected Routes**: Server-side role validation for admin and buyer dashboards

### User Sign In
1. Users visit `/login`
2. Click "Sign in with Google" button
3. Redirected to Google OAuth consent screen
4. After consent, redirected back with authorization code
5. Server exchanges code for user info and determines role based on email
6. JWT session created with user role and redirected to appropriate dashboard

### Protected Routes
- `/admin` - Admin dashboard with business metrics (admin role only)
- `/buyer` - Buyer dashboard with investment information (buyer role only)
- `/admin/documents` - Due diligence documents (admin role only)
- `/admin/metrics` - Business metrics (admin role only)

### Role Assignment
- **Admin**: Emails listed in `ADMIN_EMAILS` environment variable
- **Buyer**: Emails listed in `BUYER_EMAILS` environment variable  
- **Viewer**: All other authenticated users (limited access)

## 🗄️ Data Storage

The application uses:

- **HttpOnly Cookies**: Secure server-side session management
- **Static JSON Files**: ETL pipeline data stored in `src/data/`
- **No Database**: Simple environment-based authentication requires no database

## 🧪 Testing

The test suite covers:

- Admin authentication flow
- Login form functionality
- Protected route access
- Session management
- Error handling
- Business sale page accessibility

Run tests with:
```bash
npm test
```

## 🔧 Configuration

### Simple Auth Configuration

Located in `src/lib/simple-auth.tsx`:

- Environment-based admin authentication
- 7-day session expiration
- Local storage session management
- No database required

### Next.js Configuration

Located in `next.config.mjs`:

- Static site generation
- Image optimization
- Build optimization

## 📚 Pages

The application includes:

- `/` - Public business sale landing page
- `/login` - Admin login page
- `/dashboard` - Protected admin dashboard
- `/docs` - Protected due diligence documents

## 🛡️ Security Features

- **Environment-based Authentication**: Admin credentials stored in server-only environment variables
- **Secure Session Management**: HttpOnly, Secure cookies with server-side validation
- **Protected Routes**: Middleware-based route protection with session validation
- **CSRF Protection**: SameSite cookie attributes and server-side token validation
- **Prefetch Protection**: Server-side route guards prevent unauthorized data access
- **No Database**: No sensitive data stored in databases

## 🆘 Troubleshooting

### Common Issues

1. **Authentication not working:**
   - Verify `ADMIN_EMAILS` and `ADMIN_PASSWORDS` are set correctly (server-only variables)
   - Check that environment variables are loaded properly on the server
   - Ensure password hashes are in correct argon2id format
   - Verify server-side authentication middleware is working

2. **Build failures:**
   - Check that all dependencies are installed: `npm install`
   - Verify TypeScript compilation: `npm run build`
   - Check for missing environment variables

3. **Tests failing:**
   - Make sure local dev server is running: `npm run dev`
   - Check Playwright configuration
   - Verify test URLs are correct

## 📈 Performance

- **Static Generation**: Pre-built pages for optimal performance
- **Fast Loading**: Optimized Next.js build with code splitting
- **No Database**: No database queries or external API calls
- **Local Storage**: Fast client-side session management

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Built with ❤️ for Cranberry Hearing & Balance Center**