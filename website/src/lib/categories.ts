// Client-side categories (static data)
export const DEFAULT_CATEGORIES = [
  {
    name: 'financials',
    description: 'Financial documents including P&L, balance sheets, bank statements, and tax documents',
    required: true,
    frequency: 'monthly',
    period: '24_months'
  },
  {
    name: 'legal',
    description: 'Legal documents including leases, insurance policies, and business licenses',
    required: true,
    frequency: 'annual',
    period: 'current'
  },
  {
    name: 'equipment',
    description: 'Equipment inventory, quotes, maintenance records, and warranties',
    required: true,
    frequency: 'as_needed',
    period: 'current'
  },
  {
    name: 'operational',
    description: 'Operational data including sales records, customer data, and staff records',
    required: true,
    frequency: 'monthly',
    period: '24_months'
  },
  {
    name: 'corporate',
    description: 'Corporate documents including articles of incorporation, bylaws, and board minutes',
    required: true,
    frequency: 'as_needed',
    period: 'current'
  },
  {
    name: 'other',
    description: 'Miscellaneous documents and files',
    required: false,
    frequency: 'as_needed',
    period: 'current'
  }
];
