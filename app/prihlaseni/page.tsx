import type { Metadata } from "next"
import PrihlaseniPageContent from "@/components/prihlaseni-page-content"

export const metadata: Metadata = {
  title: "Přihlášení — Vibe coding",
  robots: { index: false, follow: false },
}

export default function PrihlaseniPage() {
  return <PrihlaseniPageContent />
}
