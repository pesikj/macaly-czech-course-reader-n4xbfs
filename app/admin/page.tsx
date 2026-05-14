import type { Metadata } from "next";
import AdminPageContent from "@/components/admin-page-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Vibe coding",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPageContent />;
}
