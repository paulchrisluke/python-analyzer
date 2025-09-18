# Cranberry Hearing & Balance Center - Business Sale Platform

A comprehensive business sale platform featuring simple data processing pipelines and a modern Next.js website for presenting business metrics and due diligence information.

## 🚀 Quick Start

### 1. **Run Data Processing Pipelines**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run individual pipelines
python simple_revenue_pipeline.py
python simple_ebitda_pipeline.py  
python simple_location_pipeline.py
```

### 2. **Start the Website**
```bash
cd website
npm install
npm run dev
```

The website will be available at `http://localhost:3000`

## 📁 Project Structure

```
├── simple_revenue_pipeline.py      # Revenue calculation pipeline
├── simple_ebitda_pipeline.py       # EBITDA calculation pipeline  
├── simple_location_pipeline.py     # Location/lease data pipeline
├── data/                           # Generated data files
│   ├── final/                      # Processed business data
│   │   ├── business_sale_data.json
│   │   ├── revenue_audit_trail.json
│   │   ├── ebitda_audit_trail.json
│   │   ├── location_data.json
│   │   └── due_diligence_stages/   # Due diligence data
│   ├── normalized/                 # Normalized data
│   └── raw/                        # Raw input data
├── docs/                           # Source business documents
│   ├── financials/                 # P&L, balance sheets, tax docs
│   ├── equipment/                  # Equipment quotes and specs
│   ├── legal/                      # Leases, insurance contracts
│   └── operational/                # Sales data, operations
├── reports/                        # Generated HTML reports
├── website/                        # Next.js business sale website
│   ├── src/                        # Website source code
│   ├── public/data/                # Data files for website
│   └── vercel.json                 # Vercel deployment config
├── requirements.txt                # Python dependencies
├── vercel.json                     # Root Vercel config
└── README.md                       # This file
```

## ✨ Key Features

### **Data Processing Pipelines**
- **Revenue Analysis**: Calculate Pennsylvania revenue from P&L reports with projections
- **EBITDA Calculation**: Compute EBIT from financial data with audit trails
- **Location Management**: Process lease data and property information
- **Standalone Scripts**: No complex dependencies, just pandas and standard libraries

### **Business Sale Website**
- **Modern Next.js Application**: Built with React, TypeScript, and Tailwind CSS
- **Role-Based Authentication**: Admin, buyer, and viewer access levels
- **Google OAuth Integration**: Secure authentication with Auth.js
- **Real-Time Data**: Dynamic business metrics and financial visualizations
- **Document Management**: Protected due diligence document access
- **NDA System**: Digital signature and compliance tracking

### **Data Integration**
- **Automatic Data Flow**: Pipelines generate JSON files consumed by website
- **Audit Trails**: Complete transparency in all calculations
- **Projections**: Revenue and EBITDA projections through 2026
- **Due Diligence**: Comprehensive data coverage analysis

## 🔧 Configuration

### **Python Dependencies**
```bash
pip install -r requirements.txt
```

Required packages:
- `pandas` - Data processing
- `numpy` - Numerical calculations  
- `pyyaml` - Configuration files
- Standard libraries: `json`, `os`, `pathlib`, `datetime`, `logging`

### **Website Dependencies**
```bash
cd website
npm install
```

Key dependencies:
- `next` - React framework
- `@vercel/analytics` - Analytics
- `@vercel/blob` - File storage
- `next-auth` - Authentication
- `tailwindcss` - Styling

## 📊 Data Processing

### **Revenue Pipeline**
- Processes P&L reports from 2023-2025
- Filters to Pennsylvania locations only (Cranberry + West View)
- Calculates monthly and annual revenue totals
- Generates projections through 2026
- Output: `revenue_audit_trail.json`

### **EBITDA Pipeline**  
- Calculates EBIT from P&L data (depreciation not available)
- Processes multiple location formats (2023 vs 2024-2025)
- Creates comprehensive audit trails
- Generates projections with growth scenarios
- Output: `ebitda_audit_trail.json`

### **Location Pipeline**
- Processes lease agreements and property data
- Calculates lease costs and property metrics
- Manages location information for both sites
- Output: `location_data.json`

## 🌐 Website Features

### **Public Pages**
- Business sale landing page with key metrics
- NDA signature system for document access
- Public business overview and financial highlights

### **Protected Areas**
- **Admin Dashboard**: Complete business metrics and analytics
- **Buyer Dashboard**: Investment information and projections  
- **Document Access**: Due diligence documents with NDA compliance
- **User Management**: Role-based access control

### **Authentication**
- Google OAuth integration
- Role-based access (admin, buyer, viewer)
- Secure session management
- Environment-based configuration

## 🚀 Deployment

### **Vercel Deployment**
The website is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel --prod
```

Configuration files:
- `vercel.json` - Root deployment config
- `website/vercel.json` - Website-specific config

### **Environment Variables**
Required for production:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret  
- `NEXTAUTH_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - Application URL
- `ADMIN_EMAILS` - Admin user emails
- `BUYER_EMAILS` - Buyer user emails

## 📈 Business Metrics

The platform calculates and presents:

- **Revenue**: $2.1M+ annual revenue (Pennsylvania locations)
- **EBITDA**: $975K+ annual EBIT (depreciation not available)
- **Locations**: 2 Pennsylvania locations (Cranberry + West View)
- **Projections**: Growth scenarios through 2026
- **Equipment**: Comprehensive equipment valuation
- **Due Diligence**: Data coverage and readiness assessment

## 🔒 Security & Privacy

- **Server-Side Authentication**: All auth logic runs server-side
- **Environment Variables**: Sensitive data in environment variables only
- **No Database**: Stateless authentication with JWT sessions
- **Protected Routes**: Middleware-based access control
- **Audit Trails**: Complete transparency in all calculations

## 🧪 Development

### **Local Development**
```bash
# Start data processing
python simple_revenue_pipeline.py

# Start website
cd website
npm run dev
```

### **Testing**
```bash
# Website tests
cd website
npm test

# Run with UI
npm run test:ui
```

## 📝 License

MIT License - see LICENSE file for details.

---

**Built for Cranberry Hearing & Balance Center Business Sale** 🏢

*This platform provides comprehensive business analysis and presentation tools for the sale of Cranberry Hearing & Balance Center, featuring automated data processing and a modern web interface for potential buyers.*