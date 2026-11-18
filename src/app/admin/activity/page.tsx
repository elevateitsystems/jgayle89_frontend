import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { AuditLogPanel } from "@/components/admin/audit-log";

export const metadata: Metadata = { title: "Activity Log" };

export default function Page() {
  return (
    <>
      <PageHeader title="Activity log" description="Every recorded back-office change: categories, badges, offers, benefits, services, settings, listings and appointments — who made it and when." />
      <AuditLogPanel limit={200} title="All changes" />
    </>
  );
}
