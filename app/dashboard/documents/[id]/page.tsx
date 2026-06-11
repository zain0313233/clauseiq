"use client"

import { use } from "react"
import { DocumentAnalysisPanel } from "@/components/documents/document-analysis-panel"

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <DocumentAnalysisPanel documentId={id} />
}
