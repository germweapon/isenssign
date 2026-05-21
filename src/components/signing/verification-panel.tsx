"use client"

import * as React from "react"
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type VerificationStatus = "idle" | "pending" | "verifying" | "verified"

interface VerificationProvider {
  id: string
  name: string
  color: string
}

const providers: VerificationProvider[] = [
  { id: "kakao", name: "카카오 인증", color: "bg-yellow-400 hover:bg-yellow-500 text-black" },
  { id: "naver", name: "네이버 인증", color: "bg-green-500 hover:bg-green-600 text-white" },
  { id: "toss", name: "토스 인증", color: "bg-blue-500 hover:bg-blue-600 text-white" },
]

interface VerificationPanelProps {
  requiredProviders?: string[]
  onVerified?: (provider: string, verifiedName: string) => void
}

export default function VerificationPanel({
  requiredProviders = ["kakao", "naver", "toss"],
  onVerified,
}: VerificationPanelProps) {
  const [status, setStatus] = React.useState<VerificationStatus>("idle")
  const [activeProvider, setActiveProvider] = React.useState<string | null>(null)
  const [verifiedName, setVerifiedName] = React.useState<string | null>(null)
  const [verifiedProvider, setVerifiedProvider] = React.useState<string | null>(null)

  const handleVerify = (providerId: string) => {
    setActiveProvider(providerId)
    setStatus("pending")

    // 인증 요청 시뮬레이션 - 대기중 -> 인증중 -> 인증 완료
    setTimeout(() => {
      setStatus("verifying")

      setTimeout(() => {
        setStatus("verified")
        setVerifiedName("홍길동")
        setVerifiedProvider(providerId)
        onVerified?.(providerId, "홍길동")
      }, 3000)
    }, 1500)
  }

  const filteredProviders = providers.filter((p) =>
    requiredProviders.includes(p.id)
  )

  const statusLabel = () => {
    switch (status) {
      case "idle":
        return null
      case "pending":
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            대기중...
          </div>
        )
      case "verifying":
        return (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            인증중...
          </div>
        )
      case "verified":
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            인증 완료
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5" />
            본인인증
          </CardTitle>
          {status === "verified" && (
            <Badge variant="success">인증 완료</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "verified" && verifiedName ? (
          <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950/20">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="font-medium text-green-800 dark:text-green-300">
                  {verifiedName}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  {providers.find((p) => p.id === verifiedProvider)?.name}으로 인증됨
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              서명을 완료하려면 본인인증이 필요합니다. 아래 방법 중 하나를 선택하세요.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {filteredProviders.map((provider) => (
                <Button
                  key={provider.id}
                  className={`flex-1 ${provider.color} border-0`}
                  disabled={status !== "idle"}
                  onClick={() => handleVerify(provider.id)}
                >
                  {activeProvider === provider.id && status !== "idle" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  {provider.name}
                </Button>
              ))}
            </div>
            {statusLabel()}
          </>
        )}
      </CardContent>
    </Card>
  )
}
