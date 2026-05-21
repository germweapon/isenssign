"use client"

import { useState, useCallback } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  createSubmission,
  sendNotification,
  ApiError,
  type CreateSubmissionRequest,
} from "@/lib/api"

interface Signer {
  id: string
  name: string
  email: string
  phone: string
}

interface CreateSubmissionDialogProps {
  templateId: string
  templateName: string
  trigger: React.ReactNode
  onSuccess?: () => void
}

const VERIFICATION_MAP: Record<string, CreateSubmissionRequest["submitters"][number]["verificationMethod"]> = {
  none: "NONE",
  kakao: "KAKAO_CERT",
  naver: "NAVER_CERT",
  toss: "TOSS_CERT",
}

function createEmptySigner(): Signer {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    phone: "",
  }
}

function CreateSubmissionDialog({
  templateId,
  templateName,
  trigger,
  onSuccess,
}: CreateSubmissionDialogProps) {
  const [open, setOpen] = useState(false)
  const [signers, setSigners] = useState<Signer[]>([createEmptySigner()])
  const [notificationMethod, setNotificationMethod] = useState("email")
  const [verificationMethod, setVerificationMethod] = useState("none")
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)

  const addSigner = useCallback(() => {
    setSigners((prev) => [...prev, createEmptySigner()])
  }, [])

  const removeSigner = useCallback((id: string) => {
    setSigners((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((s) => s.id !== id)
    })
  }, [])

  const updateSigner = useCallback(
    (id: string, field: keyof Omit<Signer, "id">, value: string) => {
      setSigners((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      )
    },
    []
  )

  const handleReset = useCallback(() => {
    setSigners([createEmptySigner()])
    setNotificationMethod("email")
    setVerificationMethod("none")
    setExpiresAt(undefined)
    setSubmitting(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    // Basic validation
    const validSigners = signers.filter((s) => s.name.trim())
    if (validSigners.length === 0) {
      toast.error("최소 1명의 서명자 이름을 입력하세요.")
      return
    }

    setSubmitting(true)

    try {
      // 1. Create submission
      const channel = notificationMethod as "email" | "kakao" | "sms"
      const verMethod = VERIFICATION_MAP[verificationMethod] ?? "NONE"

      const result = await createSubmission({
        templateId,
        expiresAt: expiresAt?.toISOString(),
        submitters: validSigners.map((s) => ({
          name: s.name,
          email: s.email || undefined,
          phone: s.phone || undefined,
          notificationChannel: channel,
          verificationMethod: verMethod,
        })),
      })

      // 2. Send notifications for each submitter
      const submission = result.data
      for (const submitter of submission.submitters) {
        try {
          await sendNotification({
            type: "signing_request",
            channel,
            recipient: {
              name: submitter.name ?? "",
              email: submitter.email ?? undefined,
              phone: submitter.phone ?? undefined,
            },
            data: {
              senderName: "발송자", // TODO: use authenticated user name
              documentName: templateName,
              expiresAt: expiresAt?.toISOString(),
            },
          })
        } catch {
          // Notification failure is non-blocking; log in dev
          if (process.env.NODE_ENV === "development") {
            console.log("알림 발송 실패:", submitter.name)
          }
        }
      }

      toast.success("서명 요청이 성공적으로 발송되었습니다.")
      setOpen(false)
      onSuccess?.()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.body.error
          : "서명 요청 생성에 실패했습니다."
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }, [signers, notificationMethod, verificationMethod, expiresAt, templateId, templateName, onSuccess])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) handleReset()
      }}
    >
      <DialogTrigger render={<>{trigger}</>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>서명 요청</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{templateName}</span>{" "}
            템플릿으로 서명을 요청합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Signers */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">서명자 추가</Label>
              <Button variant="ghost" size="xs" onClick={addSigner}>
                <Plus className="size-3" />
                추가
              </Button>
            </div>
            {signers.map((signer, index) => (
              <div
                key={signer.id}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    서명자 {index + 1}
                  </span>
                  {signers.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeSigner(signer.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="이름"
                  value={signer.name}
                  onChange={(e) =>
                    updateSigner(signer.id, "name", e.target.value)
                  }
                />
                <Input
                  type="email"
                  placeholder="이메일"
                  value={signer.email}
                  onChange={(e) =>
                    updateSigner(signer.id, "email", e.target.value)
                  }
                />
                <Input
                  type="tel"
                  placeholder="휴대폰 번호"
                  value={signer.phone}
                  onChange={(e) =>
                    updateSigner(signer.id, "phone", e.target.value)
                  }
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Notification Method */}
          <div className="flex flex-col gap-2">
            <Label>알림 방법</Label>
            <Select
              value={notificationMethod}
              onValueChange={(val) => setNotificationMethod(val ?? "email")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">이메일</SelectItem>
                <SelectItem value="kakao">카카오 알림톡</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Verification Method */}
          <div className="flex flex-col gap-2">
            <Label>본인 인증</Label>
            <Select
              value={verificationMethod}
              onValueChange={(val) => setVerificationMethod(val ?? "none")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">없음</SelectItem>
                <SelectItem value="kakao">카카오 인증</SelectItem>
                <SelectItem value="naver">네이버 인증</SelectItem>
                <SelectItem value="toss">토스 인증</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expiration Date */}
          <div className="flex flex-col gap-2">
            <Label>만료일</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiresAt && "text-muted-foreground"
                    )}
                  />
                }
              >
                <CalendarIcon className="size-4" />
                {expiresAt
                  ? format(expiresAt, "yyyy년 M월 d일", { locale: ko })
                  : "만료일을 선택하세요"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "발송 중..." : "보내기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CreateSubmissionDialog }
export type { CreateSubmissionDialogProps }
