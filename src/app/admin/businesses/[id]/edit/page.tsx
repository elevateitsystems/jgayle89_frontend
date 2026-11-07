import type { Metadata } from "next";
import { EditBusinessPage } from "@/components/admin/business-form-page";

export const metadata: Metadata = { title: "Edit business" };

export default async function EditPage({ params }: PageProps<"/admin/businesses/[id]/edit">) {
  const { id } = await params;
  return <EditBusinessPage id={id} />;
}
