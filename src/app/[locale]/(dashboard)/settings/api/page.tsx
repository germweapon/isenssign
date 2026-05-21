"use client"

import * as React from "react"
import {
  Code2,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ApiToken {
  id: string
  name: string
  token: string
  createdAt: string
  lastUsed: string | null
}

const initialTokens: ApiToken[] = [
  {
    id: "1",
    name: "프로덕션 API 키",
    token: "sk_live_abcdef1234567890abcdef1234567890",
    createdAt: "2024-01-10",
    lastUsed: "2024-01-15 14:30",
  },
  {
    id: "2",
    name: "개발 테스트 키",
    token: "sk_test_zyxwvu0987654321zyxwvu0987654321",
    createdAt: "2024-01-05",
    lastUsed: "2024-01-12 09:00",
  },
]

export default function ApiPage() {
  const [tokens, setTokens] = React.useState<ApiToken[]>(initialTokens)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [newTokenName, setNewTokenName] = React.useState("")
  const [newlyCreatedToken, setNewlyCreatedToken] = React.useState<string | null>(null)
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [visibleTokens, setVisibleTokens] = React.useState<Set<string>>(new Set())

  const handleCreate = () => {
    if (!newTokenName.trim()) return

    const token = `sk_live_${crypto.randomUUID().replace(/-/g, "")}`
    const newToken: ApiToken = {
      id: crypto.randomUUID(),
      name: newTokenName,
      token,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
    }
    setTokens((prev) => [...prev, newToken])
    setNewlyCreatedToken(token)
    setNewTokenName("")
  }

  const handleRevoke = (id: string) => {
    setTokens((prev) => prev.filter((t) => t.id !== id))
  }

  const handleCopy = (id: string, token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleVisibility = (id: string) => {
    setVisibleTokens((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const maskToken = (token: string) => {
    return `${token.slice(0, 8)}${"*".repeat(24)}${token.slice(-4)}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                API 토큰 관리
              </CardTitle>
              <CardDescription className="mt-1.5">
                API 토큰을 생성하고 관리합니다. 토큰은 안전하게 보관하세요.
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger
                render={
                  <Button onClick={() => {
                    setNewlyCreatedToken(null)
                    setNewTokenName("")
                    setShowCreateDialog(true)
                  }}>
                    <Plus className="h-4 w-4" data-icon="inline-start" />
                    토큰 생성
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새 API 토큰 생성</DialogTitle>
                  <DialogDescription>
                    {newlyCreatedToken
                      ? "토큰이 생성되었습니다. 이 토큰은 다시 표시되지 않으니 안전한 곳에 복사하세요."
                      : "토큰의 용도를 구분할 수 있는 이름을 입력하세요."}
                  </DialogDescription>
                </DialogHeader>

                {newlyCreatedToken ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
                      <code className="flex-1 text-sm font-mono break-all">
                        {newlyCreatedToken}
                      </code>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(newlyCreatedToken)
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-destructive font-medium">
                      이 토큰은 한 번만 표시됩니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="token-name">토큰 이름</Label>
                    <Input
                      id="token-name"
                      placeholder="예: 프로덕션 서버"
                      value={newTokenName}
                      onChange={(e) => setNewTokenName(e.target.value)}
                    />
                  </div>
                )}

                <DialogFooter>
                  {newlyCreatedToken ? (
                    <Button onClick={() => setShowCreateDialog(false)}>
                      확인
                    </Button>
                  ) : (
                    <Button onClick={handleCreate} disabled={!newTokenName.trim()}>
                      생성
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              생성된 API 토큰이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{token.name}</span>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground block truncate">
                      {visibleTokens.has(token.id)
                        ? token.token
                        : maskToken(token.token)}
                    </code>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>생성: {token.createdAt}</span>
                      <span>
                        마지막 사용:{" "}
                        {token.lastUsed ?? "사용 기록 없음"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => toggleVisibility(token.id)}
                    >
                      {visibleTokens.has(token.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopy(token.id, token.token)}
                    >
                      {copiedId === token.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleRevoke(token.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <a
            href="#"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            API 문서 보기
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}
