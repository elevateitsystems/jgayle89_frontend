import type { Metadata } from "next";
import { OwnerEditRequests } from "@/components/business/owner-edit-requests";

export const metadata: Metadata = { title: "Edit Requests" };

export default function Page() {
  return <OwnerEditRequests />;
}
