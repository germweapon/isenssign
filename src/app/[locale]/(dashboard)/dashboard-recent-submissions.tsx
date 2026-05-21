"use client"

import { useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
import { Loader2, RefreshCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApi } from "@/hooks/use-api"
import { fetchSubmissions, type SubmissionDTO } from "@/lib/api"

interface RecentRow {
  id: string
  recipient: string
  template: string
  status: "completed" | "pending" | "expired" | "active"
  date: string
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  completed: "success",
  pending: "warning",
  expired: "destructive",
  active: "default",
}

const statusLabel: Record<string, string> = {
  completed: "완료",
  pending: "대기중",
  expired: "만료",
  active: "진행중",
}

function mapStatus(apiStatus: string): RecentRow["status"] {
  const s = apiStatus.toUpperCase()
  if (s === "COMPLETED") return "completed"
  if (s === "EXPIRED" || s === "DECLINED") return "expired"
  if (s === "ACTIVE" || s === "SENT" || s === "OPENED") return "active"
  return "pending"
}

function toRow(sub: SubmissionDTO): RecentRow {
  const firstSubmitter = sub.submitters[0]
  return {
    id: sub.id,
    recipient: firstSubmitter?.name ?? "알 수 없음",
    template: sub.template?.name ?? "알 수 없는 문서",
    status: mapStatus(sub.status),
    date: sub.createdAt.slice(0, 10),
  }
}

interface DashboardRecentSubmissionsProps {
  labels: {
    recipient: string
    template: string
    status: string
    date: string
  }
}

export function DashboardRecentSubmissions({
  labels,
}: DashboardRecentSubmissionsProps) {
  const router = useRouter()

  const { data, loading, error, refetch } = useApi(
    () => fetchSubmissions({ limit: 5 }),
    []
  )

  const rows = useMemo(() => {
    if (!data?.data) return []
    return data.data.map(toRow)
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <p className="text-sm text-destructive">데이터를 불러올 수 없습니다</p>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCcw className="size-3" />
          다시 시도
        </Button>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        아직 서명 요청이 없습니다.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labels.recipient}</TableHead>
          <TableHead>{labels.template}</TableHead>
          <TableHead>{labels.status}</TableHead>
          <TableHead>{labels.date}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((sub) => (
          <TableRow
            key={sub.id}
            className="cursor-pointer"
            onClick={() => router.push(`/submissions/${sub.id}`)}
          >
            <TableCell className="font-medium">{sub.recipient}</TableCell>
            <TableCell>{sub.template}</TableCell>
            <TableCell>
              <Badge variant={statusVariant[sub.status]}>
                {statusLabel[sub.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{sub.date}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
