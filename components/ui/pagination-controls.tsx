"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PaginationMeta } from "@/lib/pagination"

type PaginationControlsProps = {
  pagination: PaginationMeta
  onPageChange: (page: number) => void
  className?: string
  itemLabel?: string
}

export function PaginationControls({
  pagination,
  onPageChange,
  className,
  itemLabel = "items",
}: PaginationControlsProps) {
  const { page, totalPages, total, limit } = pagination

  if (total <= limit) return null

  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-3 sm:flex-row",
        className
      )}
    >
      <p className="text-[11px] text-muted-foreground">
        Showing {start}–{end} of {total} {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Previous
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
