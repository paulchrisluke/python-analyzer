# Admin Dashboard Implementation Plan ## Data Validation & Visualization Interface ### 🎯 **Objective** Create a read-only admin dashboard that allows business owners to validate ETL pipeline calculations and visualize how key metrics are derived, without modifying the underlying data pipeline. ### 📊 **Core Features** #### 1. **Key Metrics Validation Dashboard** - Display all calculated metrics with source data breakdown - Show calculation formulas and intermediate steps - Highlight any data quality issues or anomalies - Interactive tooltips explaining each metric #### 2. **Document Status & Coverage Analysis** - Visual representation of due diligence completeness - Document status by category (financials, legal, equipment, etc.) - Missing document alerts and recommendations - File size and type validation #### 3. **Data Source Traceability** - Show which raw files contributed to each calculation - Display data extraction timestamps and sources - Highlight any data gaps or fallback strategies used - Visual data flow from raw files → normalized → final metrics #### 4. **Interactive ROI Simulator** - Pre-filled with current ETL calculations - Allow "what-if" scenarios without saving - Real-time recalculation of ROI, payback period, EBITDA - Side-by-side comparison with current values ### 🏗️ **Implementation Strategy** #### **Phase 1: Core Dashboard (Week 1)** - Admin route and authentication - Basic metrics display with source breakdown - Document status visualization #### **Phase 2: Data Validation Tools (Week 2)** - Interactive ROI simulator - Data source traceability - Calculation step-by-step breakdown #### **Phase 3: Enhanced Visualization (Week 3)** - Charts and graphs for trend analysis - Data quality indicators - Export capabilities for reports ### 📁 **File Structure**
website/src/
├── app/
│   └── admin/
│       ├── page.tsx                 # Main admin dashboard
│       ├── metrics/
│       │   └── page.tsx            # Detailed metrics view
│       ├── documents/
│       │   └── page.tsx            # Document status view
│       └── simulator/
│           └── page.tsx            # ROI simulator
├── components/
│   ├── admin/
│   │   ├── admin-dashboard.tsx     # Main dashboard layout
│   │   ├── metrics-overview.tsx    # Key metrics display
│   │   ├── metrics-breakdown.tsx   # Detailed calculation breakdown
│   │   ├── document-status.tsx     # Document coverage visualization
│   │   ├── data-sources.tsx        # Data source traceability
│   │   ├── roi-simulator.tsx       # Interactive calculator
│   │   └── data-quality-alerts.tsx # Data validation warnings
│   └── ui/
│       ├── metric-card.tsx         # Reusable metric display
│       ├── calculation-step.tsx    # Step-by-step breakdown
│       └── source-trace.tsx        # Data source visualization
├── lib/
│   ├── admin-data.ts              # Admin-specific data loading
│   ├── calculations.ts            # Client-side calculation helpers
│   └── data-validation.ts         # Data quality checks
└── types/
    └── admin.ts                   # Admin-specific TypeScript types
### 🔧 **Technical Implementation** #### **Data Loading Strategy** - Leverage existing website/src/lib/etl-data.ts pattern - Create website/src/lib/admin-data.ts for admin-specific data aggregation - Load multiple JSON files in parallel for comprehensive view - Client-side data processing for calculations and validation #### **Key Data Sources**
typescript
// Primary data sources for admin dashboard
const adminDataSources = {
  businessMetrics: 'data/final/business_sale_data.json',
  coverageAnalysis: 'data/final/due_diligence_coverage.json',
  equipmentAnalysis: 'data/final/equipment_analysis.json',
  financialSummary: 'data/final/financial_summary.json',
  dueDiligenceStages: 'data/final/due_diligence_stages/internal.json'
}
#### **Component Architecture** - **Server Components**: Data loading and initial rendering - **Client Components**: Interactive features (simulator, tooltips, charts) - **Shared Components**: Reusable UI elements for consistency ### 📋 **Detailed Component Specifications** #### **1. AdminDashboard (Main Layout)**
typescript
interface AdminDashboardProps {
  businessMetrics: BusinessMetrics;
  coverageAnalysis: CoverageAnalysis;
  equipmentData: EquipmentData;
  financialSummary: FinancialSummary;
}
**Features:** - Responsive grid layout - Quick metrics overview cards - Navigation to detailed views - Data freshness indicators #### **2. MetricsOverview**
typescript
interface MetricsOverviewProps {
  metrics: BusinessMetrics;
  calculationSteps: CalculationStep[];
  dataSources: DataSource[];
}
**Features:** - Key metrics display (Revenue, EBITDA, ROI, Payback) - Click-to-expand calculation breakdown - Source data traceability - Data quality indicators #### **3. ROISimulator**
typescript
interface ROISimulatorProps {
  currentValues: BusinessMetrics;
  onCalculate: (values: SimulatorInputs) => SimulatorResults;
}
**Features:** - Pre-filled with current ETL values - Real-time calculation updates - Side-by-side comparison view - Export simulation results #### **4. DocumentStatus**
typescript
interface DocumentStatusProps {
  coverageAnalysis: CoverageAnalysis;
  documentList: DocumentItem[];
}
**Features:** - Visual completeness indicators - Category-based organization - Missing document alerts - File validation status ### 🎨 **UI/UX Design Principles** #### **Visual Hierarchy** - **Primary**: Key metrics and alerts - **Secondary**: Detailed breakdowns and calculations - **Tertiary**: Supporting data and sources #### **Color Coding** - **Green**: Complete/Valid data - **Yellow**: Warnings/Partial data - **Red**: Missing/Critical issues - **Blue**: Interactive elements #### **Responsive Design** - Mobile-first approach - Collapsible sections for small screens - Touch-friendly interactive elements ### 🔒 **Security & Access Control** #### **Authentication** - Leverage existing AdminGuard component - Role-based access control via BetterAuth - Environment-based admin email configuration #### **Data Protection** - Server-side data loading (no client-side JSON exposure) - Admin-only routes with middleware protection - No sensitive data in client bundles ### 📈 **Success Metrics** #### **Functional Requirements** - ✅ All key metrics displayed with source breakdown - ✅ Document status clearly visualized - ✅ ROI simulator functional with real-time updates - ✅ Data quality issues highlighted - ✅ Responsive design across devices #### **Performance Requirements** - ✅ Page load time < 2 seconds - ✅ Interactive elements respond < 200ms - ✅ No client-side data processing delays #### **User Experience Requirements** - ✅ Intuitive navigation and layout - ✅ Clear data validation indicators - ✅ Helpful tooltips and explanations - ✅ Export capabilities for reports ### 🚀 **Deployment Strategy** #### **Development Workflow** 1. Create feature branch from feature/better-auth-admin-roles 2. Implement components incrementally 3. Test with existing ETL data 4. Deploy to staging for validation 5. Merge to main after approval #### **Environment Configuration** - Use existing admin email configuration - Leverage current authentication setup - No additional environment variables needed ### 📝 **Implementation Checklist** #### **Week 1: Foundation** - [ ] **Define TypeScript interfaces for ETL JSONs** (types/admin.ts) - [ ] Create admin route structure - [ ] Implement basic dashboard layout - [ ] Set up data loading for admin views - [ ] Create metrics overview component - [ ] Add document status visualization - [ ] **Add etl_run_timestamp to JSON exports** #### **Week 2: Core Features** - [ ] Build ROI simulator component - [ ] Implement calculation breakdown views - [ ] Add data source traceability - [ ] Create data quality alerts - [ ] **Implement error handling for missing/empty data** - [ ] **Clamp simulator inputs & add deviation warnings** - [ ] Test with real ETL data #### **Week 3: Polish & Enhancement** - [ ] Add charts and visualizations - [ ] Implement export functionality - [ ] **Write tooltips/explanations for each metric** - [ ] Optimize performance - [ ] Add comprehensive error handling - [ ] **Configure CI/CD to deploy ETL JSONs alongside frontend** - [ ] Final testing and documentation ### 🔄 **Future Enhancements** #### **Phase 2 Possibilities** - Real-time ETL pipeline monitoring - Automated data quality scoring - Historical trend analysis - Custom report generation - Integration with external validation tools #### **Phase 3 Possibilities** - Multi-business support - Advanced analytics and insights - Automated alerting system - API for external integrations --- ## 🔎 **Critical Implementation Details** ### **1. Schema Contract (Types)** - Define **TypeScript interfaces** that map exactly to ETL JSONs (business_sale_data.json, due_diligence_coverage.json, etc.) - Example: BusinessMetrics, DocumentItem, CoverageAnalysis interfaces - **Why**: Prevents guessing field names and ensures frontend code won't break if JSON evolves ### **2. Data Freshness Indicators** - Show **last ETL run time** on dashboard - Add JSON field: "etl_run_timestamp": "2025-09-10T23:59:59Z" - Display "Data last updated X hours ago" in UI - **Why**: Gives owner confidence numbers are current ### **3. Error & Edge Case Handling** - Handle missing JSON files gracefully - Show placeholder states: "No data available yet" - Handle ETL not run yet scenarios - Handle categories with 0 documents - **Why**: Dashboard won't look broken with missing data ### **4. Simulator Guardrails** - Clamp values to avoid nonsense (e.g., negative revenue) - Add warnings if input deviates >50% from pipeline values - Prevent unrealistic scenarios - **Why**: Keeps experiments safe & meaningful ### **5. Owner-Focused Copy** - Plain-English tooltips for each metric: - *EBITDA: Business profit before interest, taxes, depreciation, amortization* - *Payback period: How many years until buyer recoups investment* - **Why**: Prevents dashboard from feeling "too technical" ### **6. Deployment Configuration** - Ensure staging uses **real ETL outputs** (not mock data) - Add CI/CD step to copy data/final/*.json into public/data/ - **Why**: Ensures dashboard matches reality at deploy time ### **7. JSON Shape Examples** - Provide exact JSON structure examples for frontend team - Include nested object examples and field types - **Why**: Prevents misunderstandings about data structure ### **8. Testing Expectations** - Define clear verification criteria for each feature - Specify error handling scenarios to test - **Why**: Gives QA a clear checklist and prevents scope creep ### **9. Performance Guardrails** - Set JSON file size limits (<5MB per file) - Define pagination/lazy-loading strategies for large datasets - **Why**: Prevents performance surprises as data grows ### **10. Accessibility Requirements** - Semantic HTML for tables/charts - ARIA labels for tooltips and interactive elements - Color coding with text fallbacks - **Why**: Makes dashboard usable for all users --- ## 📋 **JSON Data Structure Examples** ### **Business Sale Data Structure**
json
{
  "metadata": {
    "business_name": "Cranberry Hearing and Balance Center",
    "generated_at": "2025-09-10T13:19:12.884238",
    "etl_run_timestamp": "2025-09-10T23:59:59Z",
    "data_period": "2023-01-01 to 2025-06-30",
    "months_analyzed": 30
  },
  "financials": {
    "metrics": {
      "annual_revenue_projection": 946650.61,
      "estimated_annual_ebitda": 288732.58,
      "ebitda_margin": 30.5,
      "roi_percentage": 44.42,
      "payback_period_years": 2.3,
      "equipment_value": 61728,
      "asking_price": 650000
    },
    "documents": [
      {
        "name": "Profit and Loss Statements 2023-2024",
        "file_path": "docs/financials/Profit_and_Loss/",
        "status": true,
        "file_type": "CSV",
        "file_size": "2.5MB",
        "visibility": ["public", "nda", "buyer", "internal"]
      }
    ]
  },
  "equipment": {
    "total_value": "61727.50",
    "items": [
      {
        "name": "Cello Computer Controlled Diagnostic Audiometer",
        "category": "Audiometer",
        "value": "3420.00",
        "status": true
      }
    ]
  }
}
### **Due Diligence Coverage Structure**
json
{
  "financial": {
    "status": "good",
    "completeness_score": 75.0,
    "missing_documents": ["profit_loss"],
    "data_quality_issues": ["Missing 1 critical financial documents"],
    "coverage_details": {
      "found_documents": ["balance_sheets", "general_ledger", "cogs"],
      "missing_documents": ["profit_loss"],
      "total_expected": 4,
      "found_count": 3
    },
    "fallback_strategies": ["Use sales data to estimate P&L based on industry margins"]
  },
  "due_diligence": {
    "overall_score": 40.0,
    "readiness_level": "poor",
    "recommendation": "Not ready for due diligence"
  }
}
--- ## 🧪 **Testing Expectations** ### **Core Functionality Tests** - [ ] Admin dashboard loads without error when **any JSON file is missing** - [ ] Simulator recalculates ROI instantly when inputs change - [ ] Tooltip text matches plain-English glossary - [ ] Document status shows correct completion percentages - [ ] Data freshness indicator displays accurate "last updated" time ### **Error Handling Tests** - [ ] Missing JSON files show "No data available yet" placeholder - [ ] Invalid JSON data displays error message with retry option - [ ] Simulator prevents negative values and unrealistic inputs - [ ] Large JSON files (>5MB) trigger pagination or lazy loading ### **Accessibility Tests** - [ ] All interactive elements have proper ARIA labels - [ ] Color coding has text fallbacks (not just red/yellow/green) - [ ] Tables use semantic HTML structure - [ ] Tooltips are keyboard accessible ### **Performance Tests** - [ ] Dashboard loads in <2 seconds with real ETL data - [ ] Interactive elements respond in <200ms - [ ] No memory leaks during extended simulator use - [ ] Mobile performance acceptable on standard devices --- ## 🎨 **UI Layout Wireframe**
┌─────────────────────────────────────────────────────────────┐
│ Admin Dashboard - Cranberry Hearing & Balance Center        │
├─────────────────────────────────────────────────────────────┤
│ Data Last Updated: 2 hours ago  [Refresh] [Export Report]   │
├─────────────────────────────────────────────────────────────┤
│ Key Metrics Cards                                           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ Revenue │ │ EBITDA  │ │ ROI     │ │ Payback │            │
│ │ $946K   │ │ $289K   │ │ 44.4%   │ │ 2.3 yrs │            │
│ │ [View]  │ │ [View]  │ │ [View]  │ │ [View]  │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
├─────────────────────────────────────────────────────────────┤
│ Document Status & Coverage Analysis                         │
│ ┌─────────────────┐ ┌─────────────────┐                    │
│ │ Financials      │ │ Equipment       │                    │
│ │ ●●●○○ (75%)     │ │ ●●○○○ (50%)     │                    │
│ │ 3/4 docs        │ │ 2/4 categories  │                    │
│ └─────────────────┘ └─────────────────┘                    │
├─────────────────────────────────────────────────────────────┤
│ ROI Simulator (Sidebar)                                     │
│ ┌─────────────────┐                                         │
│ │ Revenue: $946K  │                                         │
│ │ EBITDA: $289K   │                                         │
│ │ Price: $650K    │                                         │
│ │                 │                                         │
│ │ [Calculate]     │                                         │
│ │ ROI: 44.4%      │                                         │
│ └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
--- ## 📚 **Plain-English Glossary** ### **Business Metrics** - **Annual Revenue Projection**: Expected yearly income based on historical data - **EBITDA**: Business profit before interest, taxes, depreciation, and amortization - **EBITDA Margin**: EBITDA as percentage of revenue (profitability indicator) - **ROI (Return on Investment)**: Annual return percentage for potential buyer - **Payback Period**: Number of years until buyer recoups their investment - **Equipment Value**: Total worth of included business equipment - **Asking Price**: Current sale price of the business - **Market Value**: Estimated fair market value based on industry standards ### **Document Status** - **Complete**: All required documents available and validated - **Partial**: Some documents missing or need updates - **Missing**: Critical documents not available - **Stale**: Documents exist but may be outdated --- ## 🎯 **Immediate Next Steps** 1. **Review and approve this plan** 2. **Create feature branch**: feature/admin-dashboard 3. **Start with Week 1 implementation** 4. **Set up development environment** 5. **Begin with basic dashboard layout** This plan provides a clear roadmap for building a comprehensive admin dashboard that meets your data validation needs without requiring any changes to the existing ETL pipeline.