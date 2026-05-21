"use client"

import { useState, useMemo } from "react"
import { useRouter } from "@/i18n/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Eye, MoreVertical, Bell, Link2, Download, Loader2, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  StatusBadge,
  type SubmissionStatus,
} from "@/components/submissions/status-badge"
import { useApi } from "@/hooks/use-api"
import { fetchSubmissions, type SubmissionDTO } from "@/lib/api"

type TabValue = "all" | "pending" | "active" | "completed" | "expired"

const TAB_STATUS_MAP: Record<TabValue, string | undefined> = {
  all: undefined,
  pending: "PENDING",
  active: "ACTIVE",
  completed: "COMPLETED",
  expired: "EXPIRED",
}

interface FlatSubmission {
  id: string
  documentName: string
  signerName: string
  signerEmail: string
  status: SubmissionStatus
  createdAt: Date
  expiresAt: Date | null
}

function flattenSubmission(sub: SubmissionDTO): FlatSubmission {
  const firstSubmitter = sub.submitters[0]
  return {
    id: sub.id,
    documentName: sub.template?.name ?? "알 수 없는 문서",
    signerName: firstSubmitter?.name ?? "알 수 없음",
    signerEmail: firstSubmitter?.email ?? "",
    status: (sub.status ?? "PENDING") as SubmissionStatus,
    createdAt: new Date(sub.createdAt),
    expiresAt: sub.expiresAt ? new Date(sub.expiresAt) : null,
  }
}

export default function SubmissionsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>("all")

  const statusFilter = TAB_STATUS_MAP[activeTab]

  const { data, loading, error, refetch } = useApi(
    () => fetchSubmissions({ status: statusFilter }),
    [statusFilter]
  )

  const submissions = useMemo(() => {
    if (!data?.data) return []
    return data.data.map(flattenSubmission)
  }, [data])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">서명 요청</h1>

      <Tabs
        defaultValue="all"
        onValueChange={(val) => setActiveTab(val as TabValue)}
      >
        <TabsList variant="line">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="pending">대기중</TabsTrigger>
          <TabsTrigger value="active">진행중</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
          <TabsTrigger value="expired">만료</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <p className="font-medium text-destructive">
                서명 요청을 불러오는데 실패했습니다
              </p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              <Button variant="outline" onClick={refetch}>
                <RefreshCcw className="size-4" />
                다시 시도
              </Button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>문서명</TableHead>
                  <TableHead>서명자</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>만료일</TableHead>
                  <TableHead className="w-[60px]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      해당 상태의 서명 요청이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow
                      key={sub.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/submissions/${sub.id}`)}
                    >
                      <TableCell className="font-medium">
                        {sub.documentName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{sub.signerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {sub.signerEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(sub.createdAt, "yyyy.MM.dd", { locale: ko })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.expiresAt
                          ? format(sub.expiresAt, "yyyy.MM.dd", { locale: ko })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            }
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/submissions/${sub.id}`)
                              }}
                            >
                              <Eye />
                              상세 보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Bell />
                              리마인더 발송
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link2 />
                              링크 복사
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download />
                              문서 다운로드
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
