import type { Metadata } from "next";
import { EditRequestReviewQueue } from "@/components/business/edit-request-review";

export const metadata: Metadata = { title: "Edit Requests" };

export default function Page() {
  return <EditRequestReviewQueue />;
}
