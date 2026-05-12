"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MarkdownRenderer from "@/components/markdown-renderer";

interface Props {
  lectureId: string;
  fallbackContent: string | null;
}

export default function LectureContentLoader({ lectureId, fallbackContent }: Props) {
  const convexContent = useQuery(api.lectures.getLectureContent, { lectureId });

  // convexContent === undefined → still loading from Convex
  // convexContent === null → not synced yet, use local fallback
  // convexContent?.markdown → synced content from GitHub

  const markdown = convexContent?.markdown ?? fallbackContent;

  if (markdown) {
    return <MarkdownRenderer content={markdown} />;
  }

  if (convexContent === undefined) {
    // Loading state — show nothing to avoid flash
    return null;
  }

  return (
    <p
      className="italic text-muted-foreground"
      style={{ fontFamily: "var(--font-sans)", fontSize: "1rem" }}
    >
      Obsah této lekce bude doplněn později.
    </p>
  );
}
