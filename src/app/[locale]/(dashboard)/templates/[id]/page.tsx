"use client"

import { useRouter } from "@/i18n/navigation"
import { use, useState, useCallback } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  Pencil,
  Copy,
  Archive,
  Link2,
  Send,
  FileText,
  Loader2,
  RefreshCcw,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  ClipboardCopy,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useApi } from "@/hooks/use-api"
import {
  fetchTemplate,
  fetchTemplateSharing,
  createSubmission,
  type TemplateDTO,
  type CreateSubmissionRequest,
} from "@/lib/api"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubmitterForm {
  name: string
  email: string
  phone: string
  role: string
}

interface TemplateDetailParams {
  params: Promise<{ id: string; locale: string }>
}

// ---------------------------------------------------------------------------
// Signing Link Dialog
// ---------------------------------------------------------------------------

function SigningLinkDialog({ templateId }: { templateId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sharingUrl, setSharingUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleOpen = useCallback(
    async (isOpen: boolean) => {
      setOpen(isOpen)
      if (isOpen && !sharingUrl) {
        setLoading(true)
        try {
          const res = await fetchTemplateSharing(templateId)
          const origin = window.location.origin
          setSharingUrl(`${origin}/s/${res.data.slug}`)
        } catch (err) {
          console.error("서명 링크 생성 실패:", err)
        } finally {
          setLoading(false)
        }
      }
    },
    [templateId, sharingUrl]
  )

  const handleCopy = useCallback(async () => {
    if (!sharingUrl) return
    try {
      await navigator.clipboard.writeText(sharingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const input = document.createElement("input")
      input.value = sharingUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [sharingUrl])

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Link2 className="size-4" />
            서명 링크
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>서명 링크</DialogTitle>
          <DialogDescription>
            이 링크를 공유하면 누구나 서명할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : sharingUrl ? (
          <div className="flex items-center gap-2">
            <Input value={sharingUrl} readOnly className="flex-1 text-xs" />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <ClipboardCopy className="size-4" />
              )}
              {copied ? "복사됨" : "복사"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-destructive">
            링크를 생성하는데 실패했습니다.
          </p>
        )}
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Signing Request Dialog
// ---------------------------------------------------------------------------

const emptySubmitter: SubmitterForm = {
  name: "",
  email: "",
  phone: "",
  role: "서명자",
}

function SigningRequestDialog({ templateId }: { templateId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [submitters, setSubmitters] = useState<SubmitterForm[]>([
    { ...emptySubmitter },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSubmitter = (
    index: number,
    field: keyof SubmitterForm,
    value: string
  ) => {
    setSubmitters((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const addSubmitter = () => {
    setSubmitters((prev) => [...prev, { ...emptySubmitter }])
  }

  const removeSubmitter = (index: number) => {
    setSubmitters((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setError(null)

    // 유효성 검증
    const invalid = submitters.find((s) => !s.name.trim())
    if (invalid) {
      setError("모든 서명자의 이름을 입력해주세요.")
      return
    }

    const noContact = submitters.find(
      (s) => !s.email.trim() && !s.phone.trim()
    )
    if (noContact) {
      setError("모든 서명자의 이메일 또는 전화번호를 입력해주세요.")
      return
    }

    setSubmitting(true)
    try {
      const payload: CreateSubmissionRequest = {
        templateId,
        submitters: submitters.map((s) => ({
          name: s.name.trim(),
          email: s.email.trim() || undefined,
          phone: s.phone.trim() || undefined,
          role: s.role.trim() || "서명자",
        })),
      }
      const res = await createSubmission(payload)
      setOpen(false)
      router.push(`/submissions/${res.data.id}`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "서명 요청 생성에 실패했습니다."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      // reset on close
      setSubmitters([{ ...emptySubmitter }])
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Send className="size-4" />
            서명 요청
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>서명 요청 보내기</DialogTitle>
          <DialogDescription>
            서명자 정보를 입력하고 서명 요청을 보냅니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {submitters.map((submitter, index) => (
            <div
              key={index}
              className="relative flex flex-col gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  서명자 {index + 1}
                </span>
                {submitters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSubmitter(index)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">
                    이름 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="홍길동"
                    value={submitter.name}
                    onChange={(e) =>
                      updateSubmitter(index, "name", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">역할</Label>
                  <Input
                    placeholder="서명자"
                    value={submitter.role}
                    onChange={(e) =>
                      updateSubmitter(index, "role", e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">이메일</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={submitter.email}
                    onChange={(e) =>
                      updateSubmitter(index, "email", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">전화번호</Label>
                  <Input
                    type="tel"
                    placeholder="010-0000-0000"
                    value={submitter.phone}
                    onChange={(e) =>
                      updateSubmitter(index, "phone", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={addSubmitter}
          >
            <Plus className="size-4" />
            서명자 추가
          </Button>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "생성 중..." : "서명 요청 보내기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TemplateDetailPage({ params }: TemplateDetailParams) {
  const { id } = use(params)
  const router = useRouter()
  const { data, loading, error, refetch } = useApi(
    () => fetchTemplate(id),
    [id]
  )

  const template: TemplateDTO | undefined = data?.data

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error State
  if (error || !template) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <div className="text-center">
          <p className="font-medium text-destructive">
            템플릿을 불러오는데 실패했습니다
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {error?.message ?? "템플릿을 찾을 수 없습니다"}
          </p>
        </div>
        <Button variant="outline" onClick={refetch}>
          <RefreshCcw className="size-4" />
          다시 시도
        </Button>
      </div>
    )
  }

  const authorName =
    template.author?.firstName ?? template.author?.email ?? "알 수 없음"
  const authorInitials = authorName.charAt(0)
  const folderName = template.folder?.name ?? null
  const submissionCount = template._count.submissions

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {template.name}
              </h1>
              <p className="text-sm text-muted-foreground">ID: {id}</p>
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-3">
          {folderName && (
            <Badge variant="outline">{folderName}</Badge>
          )}
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {authorName}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {format(new Date(template.createdAt), "yyyy년 M월 d일", {
              locale: ko,
            })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/templates/${id}/edit`)}
          >
            <Pencil className="size-4" />
            편집
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="size-4" />
            복제
          </Button>
          <Button variant="outline" size="sm">
            <Archive className="size-4" />
            보관
          </Button>
          <SigningLinkDialog templateId={id} />
          <SigningRequestDialog templateId={id} />
        </div>
      </div>

      <Separator />

      {/* Submissions Summary */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">제출 현황</h2>
          <Badge variant="secondary">{submissionCount}건</Badge>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8">
          <p className="text-sm text-muted-foreground">
            이 템플릿으로 생성된 제출이 {submissionCount}건 있습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/submissions")}
          >
            <ExternalLink className="size-4" />
            전체 보기
          </Button>
        </div>
      </div>
    </div>
  )
}
