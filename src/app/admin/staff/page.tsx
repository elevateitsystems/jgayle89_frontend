import type { Metadata } from "next";
import { StaffManager } from "@/components/admin/staff-manager";

export const metadata: Metadata = { title: "Staff" };

export default function AdminStaffPage() {
  return <StaffManager />;
}
