/**
 * Centralized anchor ID constants for consistent navigation
 * across the application. This ensures that anchor links in the
 * sidebar match the actual section IDs on the homepage.
 */
export const ANCHORS = {
  INVESTMENT_HIGHLIGHTS: "investment-highlights",
  BUSINESS_DETAILS: "business-details", 
  LOCATION_INFORMATION: "location-information",
  DUE_DILIGENCE: "due-diligence",
  DUE_DILIGENCE_DOCUMENTS: "due-diligence-documents",
} as const;

/**
 * Helper function to generate anchor URLs
 */
export const getAnchorUrl = (anchor: keyof typeof ANCHORS): string => {
  return `/#${ANCHORS[anchor]}`;
};
