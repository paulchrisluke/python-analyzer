# Cranberry Auth Worker

A secure authentication service for the Cranberry Hearing & Balance Center business sale website, built with Cloudflare Workers and Better Auth.

## 🚀 Features

- **Secure Authentication**: Email/password authentication with Better Auth
- **Session Management**: Secure session handling with proper expiration
- **Database Integration**: D1 database with Drizzle ORM
- **Protected Routes**: Authentication-required document access
- **ETL Data Integration**: Real-time business metrics from ETL pipeline
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Testing**: Comprehensive Playwright test suite

## 📁 Project Structure

```
website/
├── src/
│   ├── index.ts          # Main Workers entry point
│   ├── auth.ts           # Better Auth configuration
│   ├── lib/
│   │   └── etl-data.ts   # ETL pipeline data integration
│   └── data/             # ETL-generated JSON data files
│       ├── landing_page_data.json
│       ├── financial_summary.json
│       └── equipment_analysis.json
├── db/
│   ├── schema.ts         # Database schema
│   └── migrations/       # Database migrations
├── tests/
│   ├── auth.spec.ts      # Authentication tests
│   └── basic.spec.ts     # Basic functionality tests
├── wrangler.toml         # Cloudflare Workers configuration
├── drizzle.config.ts     # Drizzle ORM configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Cloudflare account
- Wrangler CLI

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Set the Better Auth secret
   wrangler secret put BETTER_AUTH_SECRET
   ```

3. **Run database migrations:**
   ```bash
   # Apply migrations to local database
   npm run db:migrate
   
   # Apply migrations to remote database
   npm run db:migrate:remote
   ```

## 🚀 Development

### Local Development

```bash
# Start local development server
npm run dev
```

The application will be available at `http://localhost:8787`

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

This project uses GitHub Actions for automated CI/CD. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

### Quick Setup

1. **Set GitHub Secrets:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. **Set Worker Secrets:**
   ```bash
   wrangler secret put BETTER_AUTH_SECRET --name cranberry-auth-worker
   ```

3. **Configure Environment Variables:**
   ```bash
   # Copy environment template
   cp env.example .env
   # Edit .env with your Cloudflare credentials
   ```

4. **Deploy:**
   - Push to `main` branch → automatic deployment
   - Manual: `npm run deploy:workers` (Next on Workers via OpenNext)
   - Tests run on all pull requests

### Environment Configuration

#### Required Environment Variables

- **BETTER_AUTH_SECRET**: Set using `wrangler secret put BETTER_AUTH_SECRET`
- **BETTER_AUTH_URL**: Configured in `wrangler.toml`
- **D1 Database**: Automatically bound as `cranberry_auth_db` (database name: `cranberry-auth-db`)

#### D1 HTTP Driver Configuration (for migrations and database operations)

For local development and database migrations, you'll need to set these environment variables in your `.env` file:

- **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID
- **CLOUDFLARE_D1_DATABASE_ID**: Your D1 database ID (found in wrangler.toml)
- **CLOUDFLARE_API_TOKEN**: Your Cloudflare API token with D1 permissions

⚠️ **Security Note**: `CLOUDFLARE_API_TOKEN` should only be stored in:
- GitHub Secrets (for CI/CD)
- Local `.env` file (for development)
- **Never** as a Worker secret (account-scoped token)

Create a `.env` file in the project root with these values:

```bash
# Copy from env.example and fill in your values
cp env.example .env
```

**Note**: For production deployments, copy `wrangler.toml.example` to `wrangler.toml` and update the `database_id` with your actual D1 database ID.

## 🔐 Authentication Flow

### User Registration
1. Users visit `/signup`
2. Provide name, email, and password
3. Account created and redirected to sign in

### User Sign In
1. Users visit `/docs` (protected route)
2. Redirected to sign-in form if not authenticated
3. After successful authentication, access granted

### Protected Routes
- `/docs` - Due diligence documents
- `/docs.html` - Alternative due diligence page

## 🗄️ Database Schema

The application uses the following tables:

- **users**: User account information
- **sessions**: Active user sessions
- **accounts**: Authentication provider accounts
- **verifications**: Email verification tokens

## 🧪 Testing

The test suite covers:

- User registration flow
- User authentication
- Protected route access
- Session management
- Error handling

Run tests with:
```bash
npm test
```

## 🔧 Configuration

### Better Auth Configuration

Located in `src/auth.ts`:

- Email/password authentication enabled
- 7-day session expiration
- D1 database integration
- Debug logging in development

### Cloudflare Workers Configuration

Located in `wrangler.toml`:

- D1 database binding
- Environment variables
- Compatibility settings

## 📚 API Endpoints

Better Auth automatically provides:

- `POST /api/auth/sign-up/email` - User registration
- `POST /api/auth/sign-in/email` - User sign in
- `POST /api/auth/sign-out` - User sign out
- `GET /api/auth/get-session` - Get current session

## 🛡️ Security Features

- **Secure Password Hashing**: Automatic password hashing
- **Session Security**: HttpOnly cookies with proper expiration
- **CSRF Protection**: Built-in CSRF protection
- **Environment Secrets**: Sensitive data stored as Cloudflare secrets

## 🆘 Troubleshooting

### Common Issues

1. **Authentication not working:**
   - Verify `BETTER_AUTH_SECRET` is set correctly
   - Check that `BETTER_AUTH_URL` matches your domain
   - Ensure database migrations are applied

2. **Database connection issues:**
   - Verify D1 database binding in `wrangler.toml`
   - Check that migrations have been applied
   - Ensure database ID is correct

3. **Tests failing:**
   - Make sure local dev server is running
   - Check Playwright configuration
   - Verify test URLs are correct

### Debug Mode

Enable debug logging by setting the log level in `src/auth.ts`:

```typescript
logger: {
  level: "debug"
}
```

## 📈 Performance

- **Cold Start**: ~50ms
- **Response Time**: <100ms for most requests
- **Database**: D1 provides fast, edge-distributed queries
- **Caching**: Automatic Cloudflare caching

## 🔄 Migration from Pages

This project was migrated from Cloudflare Pages to Workers for:

- Better API endpoint support
- Improved D1 database integration
- Enhanced error handling
- More reliable authentication

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