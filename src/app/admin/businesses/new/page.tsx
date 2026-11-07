import type { Metadata } from "next";
import { BusinessForm } from "@/components/admin/business-form";

export const metadata: Metadata = { title: "Add business" };

export default function NewBusinessPage() {
  return <BusinessForm />;
}
