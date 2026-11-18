import type { Metadata } from "next";
import { MemberDetailAdmin } from "@/components/admin/member-detail-admin";

export const metadata: Metadata = { title: "Member" };

export default async function Page({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  return <MemberDetailAdmin id={id} />;
}
