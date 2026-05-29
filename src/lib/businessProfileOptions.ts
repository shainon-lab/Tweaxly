// Vocabulary constants for the Business DNA profile. Split out of
// businessProfile.ts so client components can import them without
// pulling in Prisma + the Anthropic SDK (whose Node-only imports
// break the browser bundle).

export const INDUSTRY_OPTIONS = [
  "SaaS", "E-commerce", "Marketing Agency", "Consulting", "Retail",
  "Healthcare", "Construction", "Hospitality", "Financial Services",
  "Education", "Real Estate", "Manufacturing", "Logistics & Transport",
  "Media & Publishing", "Music & Entertainment", "Food & Beverage",
  "Professional Services", "Nonprofit",
] as const;

// Specific business categories. Narrower than INDUSTRY - "Recording
// Studio" instead of "Music & Entertainment". The wizard surfaces
// these as typeahead suggestions filtered by substring match; free-
// text entries are also accepted so categories we haven't enumerated
// still work. Kept flat (not grouped) for the simplest filter UX.
export const BUSINESS_CATEGORY_OPTIONS = [
  // Music & Entertainment
  "Recording Studio", "Music School", "Live Music Venue", "DJ Service",
  "Music Production Company", "Instrument Repair / Luthier",
  "Concert Booking Agency", "Sound & Lighting Rental",
  // Retail
  "Jewelry Store", "Bookstore", "Boutique Clothing", "Shoe Store",
  "Hardware Store", "Pet Supply Store", "Toy Store", "Sporting Goods Store",
  "Antique Store", "Florist", "Gift Shop", "Vintage / Resale Shop",
  "Camera & Photo Shop", "Eyewear Shop",
  // Food & Beverage
  "Restaurant", "Café / Coffee Shop", "Bakery", "Bar / Pub",
  "Catering Service", "Food Truck", "Ice Cream Shop", "Specialty Food Shop",
  "Pizzeria", "Juice / Smoothie Bar",
  // Healthcare
  "Dental Clinic", "Physiotherapy Practice", "Veterinary Clinic",
  "Optometry / Eye Care", "Mental Health Practice", "Chiropractic Practice",
  "Massage Therapy", "Nutrition Counseling", "Home Care Service",
  "Yoga / Pilates Studio",
  // Beauty & Wellness
  "Hair Salon", "Barbershop", "Nail Salon", "Spa", "Beauty Bar",
  "Tattoo Studio", "Lash / Brow Studio", "Tanning Salon",
  // Construction / Trades
  "General Contractor", "Plumbing", "Electrical Contractor", "HVAC Service",
  "Painting Contractor", "Roofing", "Flooring Installer", "Landscaping",
  "Carpentry / Custom Furniture",
  // Real Estate
  "Real Estate Brokerage", "Property Management", "Renovation Contractor",
  "Interior Design Studio", "Architecture Studio",
  // Hospitality
  "Hotel", "B&B / Guesthouse", "Tour Operator", "Travel Agency",
  "Vacation Rental Management",
  // Education
  "Tutoring Service", "Language School", "Coding Bootcamp", "Test Prep Center",
  "Driving School", "Art Class Studio",
  // Marketing / Creative
  "Marketing Agency", "PR Agency", "Web Design Studio", "Photography Studio",
  "Video Production House", "Podcast Production", "Graphic Design Studio",
  "Brand Strategy Consultancy",
  // Professional Services
  "Law Firm", "Accounting Firm", "Tax Preparation", "Insurance Agency",
  "Financial Advisory", "Bookkeeping Service", "Business Coaching",
  "Translation Service",
  // SaaS / Tech
  "B2B SaaS", "B2C SaaS", "Productivity Tool", "DevOps / Infrastructure Tool",
  "FinTech", "EdTech", "HealthTech", "E-commerce Platform",
  "Marketing Automation", "Vertical SaaS",
  // E-commerce
  "Direct-to-Consumer Brand", "Online Marketplace Seller", "Dropshipping",
  "Subscription Box", "Etsy / Handmade Shop", "Print-on-Demand",
  // Logistics & Transport
  "Courier / Last-Mile Delivery", "Moving Company", "Trucking / Freight",
  "Auto Repair Shop", "Car Wash", "Mechanic / Auto Service",
  // Manufacturing
  "Custom Furniture", "Apparel Manufacturing", "Specialty Food Production",
  "3D Printing Service", "Small-Batch Cosmetics", "Workshop / Maker Space",
  // Pets
  "Pet Grooming", "Doggy Daycare", "Pet Boarding", "Pet Training",
  // Fitness
  "Fitness Studio / Gym", "Personal Training", "CrossFit Box",
  "Boutique Cycling Studio",
  // Events / Services
  "Cleaning Service", "Event Planning", "Wedding Planner", "Co-working Space",
  "Wedding Photography", "Event Photography",
] as const;

export const BUSINESS_MODEL_OPTIONS = [
  { value: "subscription",    label: "Subscription / recurring revenue" },
  { value: "one_time_sales",  label: "One-time sales" },
  { value: "services",        label: "Services" },
  { value: "projects",        label: "Projects / retainers" },
  { value: "marketplace",     label: "Marketplace / commissions" },
  { value: "physical",        label: "Physical products" },
  { value: "digital",         label: "Digital products" },
  { value: "advertising",     label: "Advertising revenue" },
  { value: "licensing",       label: "Licensing" },
] as const;

export const MAIN_GOAL_OPTIONS = [
  { value: "growth",            label: "Growth" },
  { value: "profitability",     label: "Profitability" },
  { value: "stability",         label: "Stability" },
  { value: "expense_reduction", label: "Reducing expenses" },
  { value: "cashflow",          label: "Increasing cash flow" },
  { value: "hiring",            label: "Hiring & scaling" },
  { value: "investment",        label: "Preparing for investment" },
  { value: "international",     label: "Expanding internationally" },
  { value: "operations",        label: "Improving operations" },
] as const;

export const CUSTOMER_TYPE_OPTIONS = [
  { value: "b2b",        label: "B2B" },
  { value: "b2c",        label: "B2C" },
  { value: "enterprise", label: "Enterprise" },
  { value: "smb",        label: "SMBs" },
  { value: "consumer",   label: "Consumers" },
  { value: "government", label: "Government" },
  { value: "mixed",      label: "Mixed" },
] as const;

export const REVENUE_STAGE_OPTIONS = [
  { value: "early",       label: "Early stage" },
  { value: "growing",     label: "Growing" },
  { value: "established", label: "Established" },
  { value: "scaling",     label: "Scaling rapidly" },
  { value: "mature",      label: "Mature business" },
  { value: "seasonal",    label: "Seasonal business" },
] as const;

export const KPI_OPTIONS = [
  { value: "revenue_growth",         label: "Revenue growth" },
  { value: "profit_margin",          label: "Profit margin" },
  { value: "cash_flow",              label: "Cash flow" },
  { value: "customer_retention",     label: "Customer retention" },
  { value: "mrr_arr",                label: "Recurring revenue" },
  { value: "operational_efficiency", label: "Operational efficiency" },
  { value: "expense_reduction",      label: "Expense reduction" },
  { value: "sales_growth",           label: "Sales growth" },
  { value: "forecast_accuracy",      label: "Forecast accuracy" },
] as const;

// Sentinel value for the "Other" pick - when present in
// businessChallenges, the UI reveals the biggestChallenge free-text
// box so the user can describe a challenge that doesn't fit a preset.
export const BUSINESS_CHALLENGE_OTHER = "other";

// Pre-set business challenges. The user can pick up to 3. The final
// "other" entry is the sentinel that unlocks the free-text field; the
// max-3 cap counts it like any other selection.
export const BUSINESS_CHALLENGE_OPTIONS = [
  { value: "cash_flow",            label: "Cash flow management" },
  { value: "customer_acquisition", label: "Customer acquisition / sales" },
  { value: "hiring",               label: "Hiring & retaining talent" },
  { value: "margins",              label: "Rising costs / margin pressure" },
  { value: "churn",                label: "Customer retention / churn" },
  { value: "marketing",            label: "Marketing / brand awareness" },
  { value: "operations",           label: "Operational efficiency" },
  { value: "scaling",              label: "Scaling the business" },
  { value: BUSINESS_CHALLENGE_OTHER, label: "Other" },
] as const;

export const BUSINESS_CHALLENGE_MAX = 3;

// Phase-3 AI Context Preferences. Named bias toggles + a free-text
// extra-context box, persisted as JSON on BusinessProfile so the
// shape can evolve. The labels read like sentences the user is
// "instructing" the advisor with - matches the spec's framing.
export const AI_PREFERENCE_TOGGLES = [
  { value: "conservative_forecast", label: "Prefer conservative forecasting" },
  { value: "focus_profitability",   label: "Prioritize profitability recommendations" },
  { value: "focus_growth",          label: "Focus on growth opportunities" },
  { value: "avoid_aggressive",      label: "Avoid aggressive expansion suggestions" },
  { value: "flag_risk_early",       label: "Flag downside risks early and often" },
  { value: "prefer_data_grounded",  label: "Prefer data-grounded answers over general advice" },
  { value: "long_horizon",          label: "Plan with a long horizon (12+ months)" },
  { value: "short_horizon",         label: "Plan tactically (next 3 months focus)" },
] as const;
