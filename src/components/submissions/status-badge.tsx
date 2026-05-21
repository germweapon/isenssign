"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SubmissionStatus =
  | "PENDING"
  | "SENT"
  | "ACTIVE"
  | "OPENED"
  | "COMPLETED"
  | "DECLINED"
  | "EXPIRED"
  | "ARCHIVED"

interface StatusBadgeProps {
  status: SubmissionStatus
  className?: string
}

const statusConfig: Record<
  SubmissionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  PENDING: { label: "대기중", variant: "secondary" },
  SENT: { label: "진행중", variant: "default", className: "bg-blue-600 text-white" },
  ACTIVE: { label: "진행중", variant: "default", className: "bg-blue-600 text-white" },
  OPENED: { label: "열람", variant: "outline" },
  COMPLETED: { label: "완료", variant: "default", className: "bg-green-600 text-white" },
  DECLINED: { label: "거절", variant: "destructive" },
  EXPIRED: { label: "만료", variant: "outline", className: "text-muted-foreground" },
  ARCHIVED: { label: "보관", variant: "outline", className: "text-muted-foreground" },
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

export { StatusBadge }
export type { SubmissionStatus, StatusBadgeProps }
