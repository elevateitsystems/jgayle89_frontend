import type { BenefitCategory } from "@/types";

export const benefitCategories: { id: BenefitCategory; name: string; description: string }[] = [
  { id: "education", name: "Education", description: "Tuition, training and school-related support." },
  { id: "healthcare", name: "Healthcare", description: "Medical, mental health and crisis support." },
  { id: "housing", name: "Housing", description: "Home loans, grants and housing assistance." },
  { id: "employment", name: "Employment", description: "Hiring preferences, job training and business help." },
  { id: "disability", name: "Disability", description: "Compensation and support for service-connected conditions." },
  { id: "tax", name: "Tax Benefits", description: "Tax exemptions and favorable tax treatment." },
  { id: "financial", name: "Financial Assistance", description: "Income support and survivor payments." },
];

export const benefitCategoryName = (id: string) => benefitCategories.find((c) => c.id === id)?.name ?? id;
