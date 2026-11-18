import type { BenefitAudience, BenefitCategory } from "@/types";

export const benefitCategories: { id: BenefitCategory; name: string; description: string }[] = [
  { id: "education", name: "Education", description: "Tuition, training and school-related support." },
  { id: "healthcare", name: "Healthcare", description: "Medical, mental health and crisis support." },
  { id: "housing", name: "Housing", description: "Home loans, grants and housing assistance." },
  { id: "employment", name: "Employment", description: "Hiring preferences, job training and business help." },
  { id: "disability", name: "Disability", description: "Compensation and support for service-connected conditions." },
  { id: "tax", name: "Tax Benefits", description: "Tax exemptions and favorable tax treatment." },
  { id: "financial", name: "Financial Assistance", description: "Income support and survivor payments." },
  { id: "family", name: "Military Spouse & Family", description: "Support for spouses, children and survivors." },
  { id: "other", name: "Other Military Benefits", description: "Other military-related programs and resources." },
];

export const benefitCategoryName = (id: string) => benefitCategories.find((c) => c.id === id)?.name ?? id;

/** "Military background" filter options (client update §2A). */
export const benefitAudiences: { id: BenefitAudience; name: string }[] = [
  { id: "veterans", name: "Veterans" },
  { id: "active_duty", name: "Active duty" },
  { id: "reserve_guard", name: "Reserve & National Guard" },
  { id: "disabled_veterans", name: "Disabled veterans" },
  { id: "families", name: "Military spouses & families" },
  { id: "survivors", name: "Survivors" },
];
