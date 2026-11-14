import type { Metadata } from "next";
import { VerificationQueue } from "@/components/badges/verification-queue";

export const metadata: Metadata = { title: "Business Verification" };

export default function Page() {
  return <VerificationQueue />;
}
