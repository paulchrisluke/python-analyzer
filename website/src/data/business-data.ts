/**
 * Shared business data for the Cranberry Hearing & Balance Center
 * This data is used across multiple pages to ensure consistency
 */

export const staticBusinessData = {
  businessMetrics: {
    askingPrice: 650000,
    annualRevenue: 0, // Will be overridden by real data
    annualEbitda: 0, // Will be overridden by real data
    ebitdaMargin: 0.43, // Will be calculated from real data
  },
  listing_details: {
    business_name: 'Cranberry Hearing & Balance Center',
    business_type: 'Audiology Practice',
    asking_price: 650000,
    established: '2003',
    locations: 2,
    state: 'PA',
  },
  financial_highlights: {
    asking_price: 650000,
    annual_revenue: 0, // Will be overridden by real data
    annual_ebitda: 0, // Will be overridden by real data
    sde: 0,
    monthly_cash_flow: 0,
    roi: 0,
    payback_period: 0,
    ebitda_margin: 0.43, // Will be calculated from real data
  },
  property_details: {
    primary_location: {
      name: 'Cranberry Hearing & Balance',
      address: '20820 Route 19, Suite A',
      city: 'Cranberry Twp',
      state: 'PA',
      zip_code: '16066',
      phone: '724-779-4444',
      google_maps_url:
        'https://www.google.com/maps/place/20820%20Route%2019+Cranberry%20Twp+PA+16066',
      location_type: 'primary',
      for_sale: true,
    },
    secondary_location: {
      name: 'Cranberry Hearing & Balance - West View',
      address: '999 West View Park Drive',
      city: 'Pittsburgh',
      state: 'PA',
      zip_code: '15229',
      phone: '412-931-9290',
      google_maps_url:
        'https://www.google.com/maps/place/999%20West%20View%20Park%20Drive+Pittsburgh+PA+15229',
      location_type: 'satellite',
      for_sale: true,
    },
    lease_analysis: {
      monthly_rent: 8500,
      annual_rent: 102000,
      monthly_cam: 1200,
      annual_cam: 14400,
      total_monthly_cost: 9700,
      total_annual_cost: 116400,
      cam_percentage: 12.4,
    },
    total_locations: 2,
    property_type: 'Medical Office',
  },
  business_operations: {
    services: [
      'Hearing Evaluations',
      'Hearing Aid Sales & Fitting',
      'Balance Testing',
      'Tinnitus Management',
      'Custom Ear Protection',
    ],
    insurance_coverage: {
      total_insurers: 2,
      insurers: [
        {
          name: 'State Farm Insurance',
          years_active: 5,
          contract_date: '2019-01-01',
          status: 'Active',
          coverage_type: 'General Liability',
        },
        {
          name: 'Medical Professional Insurance',
          years_active: 3,
          contract_date: '2021-01-01',
          status: 'Active',
          coverage_type: 'Professional Liability',
        },
      ],
      total_years_coverage: 8,
      average_years_per_insurer: 4,
      coverage_stability_score: 0.85,
    },
    payment_methods: [
      'Cash',
      'Check',
      'Credit Card',
      'Insurance',
      'Financing Available',
    ],
    equipment_value: '61728',
    business_hours: 'Monday-Friday 8AM-5PM',
  },
  business_overview: {
    established_year: 2003,
    total_employees: 8,
    services_offered: [
      'Hearing Evaluations',
      'Hearing Aid Sales & Fitting',
      'Balance Testing',
      'Tinnitus Management',
      'Custom Ear Protection',
    ],
    equipment_list: [
      'State-of-the-art audiometers',
      'Real-ear measurement systems',
      'Balance testing equipment',
      'Tinnitus assessment tools',
    ],
    business_type: 'Audiology Practice',
    target_market: 'Adults 50+ with hearing loss',
  },
  business_description: {
    paragraphs: [
      {
        text: 'Cranberry Hearing and Balance Center is a well-established, multi-location audiology practice serving the Cranberry Township & Pittsburgh Metro Area. Founded in 2003, the practice has built a strong reputation for providing comprehensive hearing healthcare services to patients of all ages.',
        highlight: 'Cranberry Hearing and Balance Center',
      },
      {
        text: 'The business operates from 2 strategic locations, offering a full range of audiological services including hearing evaluations, hearing aid sales & fitting, balance testing, tinnitus management, and custom ear protection. The practice has developed strong relationships with local healthcare providers and maintains a loyal patient base.',
      },
    ],
    keyStrengths: [
      'Established insurance relationships (UPMC since 2006, Aetna since 2015)',
      'Two prime locations in growing markets',
      'Professional audiology equipment included ($61,728 value)',
      'Steady cash flow from insurance payments',
      'Absentee owner opportunity',
      'Strong EBITDA margins',
      'Over 20 years of established business operations',
    ],
    marketOpportunity:
      'High growth potential due to aging population demographics - Limited local competition with established insurance relationships providing a significant market advantage.',
  },
  key_benefits: [
    'Established insurance relationships (UPMC since 2006, Aetna since 2015)',
    'Two prime locations in growing markets',
    'Professional audiology equipment included',
    'Steady cash flow from insurance payments',
    'Absentee owner opportunity',
    'Strong EBITDA margins',
    'Over 20 years of established business operations',
  ],
  market_opportunity: {
    local_market: 'Cranberry Township & Pittsburgh Metro Area',
    competition: 'Limited local competition',
    growth_potential: 'High - aging population demographics',
    market_advantage: 'Established insurance relationships',
  },
  transaction_terms: {
    financing_available: true,
    seller_financing: '20% down, seller carryback available',
    training_period: '30 days',
    reason_for_sale: 'Owner retirement and lifestyle change',
    transition_support: 'Available for smooth transition',
  },
}
