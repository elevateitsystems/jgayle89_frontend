import type { Metadata } from "next";
import { PublicResources } from "@/components/membership/public-resources";

export const metadata: Metadata = {
  title: "Community Resources",
  description: "Free community, career and financial resources for veterans and their families.",
};

export default function Page() {
  return <PublicResources />;
}
