import type { Metadata } from "next";
import { PhotosManager } from "@/components/admin/photos-manager";

export const metadata: Metadata = { title: "Photos" };

export default function AdminPhotosPage() {
  return <PhotosManager />;
}
