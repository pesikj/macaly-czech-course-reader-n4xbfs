"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MarkdownRenderer from "@/components/markdown-renderer";
import { useEffect, useState } from "react";

interface Props {
  lectureId: string;
  fallbackContent: string | null;
}

export default function LectureContentLoader({ lectureId, fallbackContent }: Props) {
  const convexContent = useQuery(api.lectures.getLectureContent, { lectureId });
  const [fetchedMarkdown, setFetchedMarkdown] = useState<string | null>(null);

  useEffect(() => {
    if (!convexContent?.url) return;
    fetch(convexContent.url)
      .then((r) => r.text())
      .then(setFetchedMarkdown)
      .catch(() => setFetchedMarkdown(null));
  }, [convexContent?.url]);

  // convexContent === undefined → still loading from Convex
  // convexContent === null → not synced yet, use local fallback
  // fetchedMarkdown → synced content fetched from storage URL

  const markdown = fetchedMarkdown ?? convexContent?.markdown ?? (convexContent === null ? fallbackContent : null);

  if (markdown) {
    return <MarkdownRenderer content={markdown} />;
  }

  if (convexContent === undefined || (convexContent !== null && !fetchedMarkdown)) {
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
