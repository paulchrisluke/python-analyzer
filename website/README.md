# Cranberry Hearing & Balance Center - Business Sale Website

A modern Next.js application for the Cranberry Hearing & Balance Center business sale, featuring a simple admin-only authentication system and comprehensive business data presentation.

## 🚀 Features

- **Simple Admin Authentication**: Environment-based authentication for two admin accounts
- **Session Management**: Local storage-based session handling with 7-day expiration
- **Protected Routes**: Admin-only access to dashboard and documents
- **ETL Data Integration**: Real-time business metrics from ETL pipeline
- **Modern UI**: Clean, responsive design with Tailwind CSS and shadcn/ui
- **Testing**: Comprehensive Playwright test suite
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
   
   # Edit .env.local with your admin credentials
   # NEXT_PUBLIC_ADMIN_EMAILS=your-email@example.com,admin2@example.com
   # NEXT_PUBLIC_ADMIN_PASSWORDS=password1,password2
   ```

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

- **NEXT_PUBLIC_ADMIN_EMAILS**: Comma-separated list of admin email addresses
- **NEXT_PUBLIC_ADMIN_PASSWORDS**: Comma-separated list of admin passwords (in same order as emails)
- **NEXT_PUBLIC_APP_URL**: Base URL for the application (default: http://localhost:3000)
- **NODE_ENV**: Environment (development/production)

#### Example Environment File

```bash
# Admin Configuration
NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com
NEXT_PUBLIC_ADMIN_PASSWORDS=password1,password2

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

⚠️ **Security Note**: In production, use secure passwords and consider using environment-specific configuration.

## 🔐 Authentication Flow

### Admin Sign In
1. Admins visit `/login`
2. Enter email and password from environment variables
3. Session stored in localStorage with 7-day expiration
4. Redirected to dashboard after successful authentication

### Protected Routes
- `/dashboard` - Admin dashboard with business metrics
- `/docs` - Due diligence documents

### Session Management
- Sessions are stored in browser localStorage
- 7-day automatic expiration
- Manual sign out clears session

## 🗄️ Data Storage

The application uses:

- **Local Storage**: Browser localStorage for session management
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

- **Environment-based Authentication**: Admin credentials stored in environment variables
- **Session Security**: Local storage with automatic expiration
- **Protected Routes**: Middleware-based route protection
- **No Database**: No sensitive data stored in databases

## 🆘 Troubleshooting

### Common Issues

1. **Authentication not working:**
   - Verify `NEXT_PUBLIC_ADMIN_EMAILS` and `NEXT_PUBLIC_ADMIN_PASSWORDS` are set correctly
   - Check that environment variables are loaded properly
   - Ensure passwords match exactly (case-sensitive)

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