"use client"

import * as React from "react"
import {
  Webhook,
  Plus,
  Trash2,
  TestTube,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
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
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

interface WebhookEntry {
  id: string
  url: string
  events: string[]
  active: boolean
  lastTriggered: string | null
}

const availableEvents = [
  { value: "submission.created", label: "제출 생성됨" },
  { value: "submission.completed", label: "제출 완료됨" },
  { value: "submission.expired", label: "제출 만료됨" },
  { value: "submission.archived", label: "제출 보관됨" },
  { value: "submitter.signed", label: "서명자 서명 완료" },
  { value: "submitter.opened", label: "서명자 문서 열람" },
  { value: "submitter.declined", label: "서명자 거절" },
  { value: "template.created", label: "템플릿 생성됨" },
  { value: "template.updated", label: "템플릿 수정됨" },
]

const initialWebhooks: WebhookEntry[] = [
  {
    id: "1",
    url: "https://example.com/webhooks/isenssign",
    events: ["submission.completed", "submitter.signed"],
    active: true,
    lastTriggered: "2024-01-15 14:30",
  },
  {
    id: "2",
    url: "https://api.myapp.com/hooks/sign-complete",
    events: ["submission.completed"],
    active: false,
    lastTriggered: "2024-01-10 09:15",
  },
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = React.useState<WebhookEntry[]>(initialWebhooks)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newUrl, setNewUrl] = React.useState("")
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([])
  const [testingId, setTestingId] = React.useState<string | null>(null)

  const toggleEvent = (eventValue: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    )
  }

  const handleAdd = () => {
    if (!newUrl || selectedEvents.length === 0) return

    const newWebhook: WebhookEntry = {
      id: crypto.randomUUID(),
      url: newUrl,
      events: selectedEvents,
      active: true,
      lastTriggered: null,
    }
    setWebhooks((prev) => [...prev, newWebhook])
    setNewUrl("")
    setSelectedEvents([])
    setShowAddForm(false)
  }

  const handleDelete = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
  }

  const handleToggle = (id: string, active: boolean) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active } : w))
    )
  }

  const handleTest = (id: string) => {
    setTestingId(id)
    // 테스트 요청 시뮬레이션
    setTimeout(() => setTestingId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                웹훅 관리
              </CardTitle>
              <CardDescription className="mt-1.5">
                외부 서비스에 이벤트 알림을 전송합니다.
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4" data-icon="inline-start" />
              웹훅 추가
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 추가 폼 */}
          {showAddForm && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">새 웹훅 추가</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">웹훅 URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://example.com/webhooks"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>이벤트 선택</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableEvents.map((event) => (
                      <label
                        key={event.value}
                        className="flex items-center gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(event.value)}
                          onChange={() => toggleEvent(event.value)}
                          className="rounded border-input"
                        />
                        <div>
                          <div className="text-sm font-medium">{event.label}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {event.value}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button onClick={handleAdd} disabled={!newUrl || selectedEvents.length === 0}>
                  추가
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewUrl("")
                    setSelectedEvents([])
                  }}
                >
                  취소
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* 웹훅 목록 */}
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              등록된 웹훅이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono truncate">
                        {webhook.url}
                      </code>
                      {webhook.active ? (
                        <Badge variant="success">활성</Badge>
                      ) : (
                        <Badge variant="secondary">비활성</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs font-mono">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    {webhook.lastTriggered && (
                      <p className="text-xs text-muted-foreground">
                        마지막 호출: {webhook.lastTriggered}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={(checked) =>
                        handleToggle(webhook.id, checked)
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingId === webhook.id}
                    >
                      {testingId === webhook.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" data-icon="inline-start" />
                      )}
                      테스트
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
