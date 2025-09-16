/**
 * Business Rules Schema for Due Diligence Document Maker
 * 
 * This schema defines the business logic for document requirements
 * during different stages of business sale due diligence.
 */

// Due Diligence Stages
export type DueDiligenceStage = 
  | 'pre_sale_preparation'    // 6-12 months before sale
  | 'due_diligence_phase'     // 3-6 months before sale  
  | 'closing_phase'          // 1-3 months before sale
  | 'post_sale_transition';   // immediately after sale

// Stakeholder Roles
export type StakeholderRole = 
  | 'buyer'                  // Potential buyer
  | 'buyer_advisor'          // Buyer's financial/legal advisors
  | 'seller'                 // Business owner
  | 'seller_advisor'         // Seller's financial/legal advisors
  | 'auditor'                // External auditors
  | 'legal_counsel'          // Legal teams
  | 'banker'                 // Lending institutions
  | 'admin';                 // Internal administrators

// Document Priority Levels
export type DocumentPriority = 
  | 'critical'               // Must have for deal to proceed
  | 'high'                   // Strongly recommended
  | 'medium'                 // Nice to have
  | 'low';                   // Optional

// Business Sale Types
export type SaleType = 
  | 'asset_sale'             // Assets only
  | 'stock_sale'             // Entire company
  | 'merger'                 // Merger transaction
  | 'partnership_buyout';    // Partnership dissolution

// Document Requirements by Stage and Role
export interface DocumentRequirement {
  document_type: string;
  priority: DocumentPriority;
  required_for_roles: StakeholderRole[];
  stage_requirements: {
    [K in DueDiligenceStage]?: {
      required: boolean;
      priority: DocumentPriority;
      expected_count: number;
      period: string;
      notes?: string;
    };
  };
  sale_type_requirements: {
    [K in SaleType]?: {
      required: boolean;
      priority: DocumentPriority;
      additional_requirements?: string[];
    };
  };
}

// Category Business Rules
export interface CategoryBusinessRule {
  category_name: string;
  description: string;
  base_requirements: {
    required: boolean;
    frequency: 'monthly' | 'annual' | 'as_needed' | 'quarterly';
    period: 'current' | '12_months' | '24_months' | '36_months';
    default_priority: DocumentPriority;
  };
  stage_modifications: {
    [K in DueDiligenceStage]?: {
      priority_override?: DocumentPriority;
      period_extension?: string;
      additional_requirements?: string[];
    };
  };
  role_visibility: {
    [K in StakeholderRole]?: {
      can_view: boolean;
      can_download: boolean;
      requires_nda?: boolean;
      redaction_required?: boolean;
    };
  };
  sale_type_modifications: {
    [K in SaleType]?: {
      priority_override?: DocumentPriority;
      additional_documents?: string[];
      period_extension?: string;
    };
  };
}

// Business Rules Configuration
export interface BusinessRulesConfig {
  version: string;
  last_updated: string;
  business_type: 'healthcare' | 'retail' | 'manufacturing' | 'services' | 'technology' | 'other';
  sale_type: SaleType;
  current_stage: DueDiligenceStage;
  
  // Document categories with business rules
  categories: CategoryBusinessRule[];
  
  // Specific document requirements
  document_requirements: DocumentRequirement[];
  
  // Global settings
  global_settings: {
    default_retention_period: string;
    require_nda_for_sensitive_docs: boolean;
    auto_redact_pii: boolean;
    backup_requirements: {
      cloud_backup: boolean;
      local_backup: boolean;
      offsite_backup: boolean;
    };
  };
  
  // Compliance requirements
  compliance: {
    industry_standards: string[];
    regulatory_requirements: string[];
    audit_trail_required: boolean;
    version_control_required: boolean;
  };
}

// Due Diligence Checklist Item
export interface DueDiligenceChecklistItem {
  id: string;
  category: string;
  document_type: string;
  title: string;
  description: string;
  priority: DocumentPriority;
  required_for_stage: DueDiligenceStage[];
  required_for_roles: StakeholderRole[];
  expected_count: number;
  period: string;
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  assigned_to?: StakeholderRole;
  due_date?: string;
  notes?: string;
  related_documents?: string[];
}

// Due Diligence Progress Tracking
export interface DueDiligenceProgress {
  stage: DueDiligenceStage;
  overall_completion: number; // 0-100
  category_progress: {
    [category: string]: {
      completion: number;
      critical_missing: number;
      high_priority_missing: number;
      total_expected: number;
      total_found: number;
    };
  };
  role_readiness: {
    [K in StakeholderRole]?: {
      ready: boolean;
      missing_critical: number;
      missing_high_priority: number;
      completion_percentage: number;
    };
  };
  next_milestones: {
    stage: DueDiligenceStage;
    target_date: string;
    critical_items: string[];
  }[];
}

// Default Business Rules for Healthcare Business Sale
export const DEFAULT_HEALTHCARE_BUSINESS_RULES: BusinessRulesConfig = {
  version: "1.0.0",
  last_updated: new Date().toISOString(),
  business_type: "healthcare",
  sale_type: "asset_sale",
  current_stage: "pre_sale_preparation",
  
  categories: [
    {
      category_name: "financials",
      description: "Financial documents including P&L, balance sheets, bank statements, and tax documents",
      base_requirements: {
        required: true,
        frequency: "monthly",
        period: "24_months",
        default_priority: "critical"
      },
      stage_modifications: {
        due_diligence_phase: {
          priority_override: "critical",
          period_extension: "36_months",
          additional_requirements: ["audited_financials", "projections"]
        },
        closing_phase: {
          priority_override: "critical",
          additional_requirements: ["final_audit", "closing_balance_sheet"]
        }
      },
      role_visibility: {
        buyer: { can_view: true, can_download: true, requires_nda: true },
        buyer_advisor: { can_view: true, can_download: true, requires_nda: true },
        auditor: { can_view: true, can_download: true, requires_nda: false },
        admin: { can_view: true, can_download: true, requires_nda: false }
      },
      sale_type_modifications: {
        stock_sale: {
          priority_override: "critical",
          period_extension: "36_months",
          additional_documents: ["historical_financials", "equity_records"]
        }
      }
    },
    {
      category_name: "legal",
      description: "Legal documents including leases, insurance policies, and business licenses",
      base_requirements: {
        required: true,
        frequency: "annual",
        period: "current",
        default_priority: "critical"
      },
      stage_modifications: {
        due_diligence_phase: {
          priority_override: "critical",
          additional_requirements: ["litigation_history", "regulatory_compliance"]
        }
      },
      role_visibility: {
        buyer: { can_view: true, can_download: true, requires_nda: true },
        legal_counsel: { can_view: true, can_download: true, requires_nda: false },
        admin: { can_view: true, can_download: true, requires_nda: false }
      },
      sale_type_modifications: {
        stock_sale: {
          additional_documents: ["corporate_charter", "shareholder_agreements"]
        }
      }
    },
    {
      category_name: "operational",
      description: "Operational data including patient records, staff records, and procedures",
      base_requirements: {
        required: true,
        frequency: "monthly",
        period: "24_months",
        default_priority: "high"
      },
      stage_modifications: {
        due_diligence_phase: {
          priority_override: "critical",
          additional_requirements: ["patient_volume_analysis", "staff_retention_data"]
        }
      },
      role_visibility: {
        buyer: { can_view: true, can_download: false, requires_nda: true, redaction_required: true },
        buyer_advisor: { can_view: true, can_download: false, requires_nda: true, redaction_required: true },
        admin: { can_view: true, can_download: true, requires_nda: false }
      },
      sale_type_modifications: {}
    }
  ],
  
  document_requirements: [
    {
      document_type: "audited_financial_statements",
      priority: "critical",
      required_for_roles: ["buyer", "buyer_advisor", "auditor"],
      stage_requirements: {
        due_diligence_phase: {
          required: true,
          priority: "critical",
          expected_count: 3,
          period: "36_months",
          notes: "Must be audited by independent CPA"
        }
      },
      sale_type_requirements: {
        stock_sale: {
          required: true,
          priority: "critical",
          additional_requirements: ["historical_audits"]
        }
      }
    }
  ],
  
  global_settings: {
    default_retention_period: "7_years",
    require_nda_for_sensitive_docs: true,
    auto_redact_pii: true,
    backup_requirements: {
      cloud_backup: true,
      local_backup: true,
      offsite_backup: false
    }
  },
  
  compliance: {
    industry_standards: ["HIPAA", "OSHA", "Joint Commission"],
    regulatory_requirements: ["State Medical Board", "CMS", "DEA"],
    audit_trail_required: true,
    version_control_required: true
  }
};

// Helper functions for business rules
export class BusinessRulesEngine {
  static getDocumentPriority(
    category: string, 
    stage: DueDiligenceStage, 
    role: StakeholderRole,
    saleType: SaleType,
    rules: BusinessRulesConfig
  ): DocumentPriority {
    const categoryRule = rules.categories.find(c => c.category_name === category);
    if (!categoryRule) return "medium";
    
    // Check stage modifications
    const stageMod = categoryRule.stage_modifications[stage];
    if (stageMod?.priority_override) {
      return stageMod.priority_override;
    }
    
    // Check sale type modifications
    const saleMod = categoryRule.sale_type_modifications[saleType];
    if (saleMod?.priority_override) {
      return saleMod.priority_override;
    }
    
    return categoryRule.base_requirements.default_priority;
  }
  
  static canRoleAccessDocument(
    category: string,
    role: StakeholderRole,
    rules: BusinessRulesConfig
  ): { can_view: boolean; can_download: boolean; requires_nda: boolean; redaction_required: boolean } {
    const categoryRule = rules.categories.find(c => c.category_name === category);
    if (!categoryRule) {
      return { can_view: false, can_download: false, requires_nda: true, redaction_required: true };
    }
    
    const roleAccess = categoryRule.role_visibility[role];
    if (!roleAccess) {
      return { can_view: false, can_download: false, requires_nda: true, redaction_required: true };
    }
    
    return {
      can_view: roleAccess.can_view,
      can_download: roleAccess.can_download,
      requires_nda: roleAccess.requires_nda || false,
      redaction_required: roleAccess.redaction_required || false
    };
  }
  
  static getExpectedDocumentCount(
    category: string,
    stage: DueDiligenceStage,
    rules: BusinessRulesConfig
  ): number {
    const categoryRule = rules.categories.find(c => c.category_name === category);
    if (!categoryRule) return 0;
    
    // Check stage modifications for period extension
    const stageMod = categoryRule.stage_modifications[stage];
    const period = stageMod?.period_extension || categoryRule.base_requirements.period;
    
    // Calculate based on frequency and period
    switch (categoryRule.base_requirements.frequency) {
      case 'monthly':
        switch (period) {
          case '36_months': return 36;
          case '24_months': return 24;
          case '12_months': return 12;
          case 'current': return 1;
          default: return 24;
        }
      case 'annual':
        switch (period) {
          case '36_months': return 3;
          case '24_months': return 2;
          case '12_months': return 1;
          case 'current': return 1;
          default: return 2;
        }
      case 'quarterly':
        switch (period) {
          case '24_months': return 8;
          case '12_months': return 4;
          case 'current': return 1;
          default: return 8;
        }
      case 'as_needed':
        return 1;
      default:
        return 1;
    }
  }
}
