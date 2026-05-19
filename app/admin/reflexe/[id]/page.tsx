import type { Metadata } from "next";
import DiscussionViewContent from "@/components/discussion-view-content";

export const metadata: Metadata = {
  title: "Diskuze — Vibe coding Admin",
};

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiscussionViewContent questionDocId={id} />;
}
