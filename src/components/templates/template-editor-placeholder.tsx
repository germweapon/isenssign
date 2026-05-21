"use client"

import {
  PenTool,
  Type,
  CalendarDays,
  CheckSquare,
  Fingerprint,
  FileText,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface FieldPaletteItem {
  id: string
  label: string
  icon: React.ReactNode
}

const FIELD_PALETTE: FieldPaletteItem[] = [
  { id: "signature", label: "서명", icon: <PenTool className="size-5" /> },
  { id: "text", label: "텍스트", icon: <Type className="size-5" /> },
  { id: "date", label: "날짜", icon: <CalendarDays className="size-5" /> },
  { id: "checkbox", label: "체크박스", icon: <CheckSquare className="size-5" /> },
  { id: "initials", label: "이니셜", icon: <Fingerprint className="size-5" /> },
]

function TemplateEditorPlaceholder() {
  return (
    <div className="flex h-full min-h-[600px] gap-0 overflow-hidden rounded-lg border">
      {/* Left: Field Palette */}
      <div className="flex w-60 shrink-0 flex-col border-r bg-background">
        <div className="border-b p-4">
          <h3 className="text-sm font-semibold">필드 팔레트</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            필드를 드래그하여 문서에 배치하세요
          </p>
        </div>
        <div className="flex flex-col gap-2 p-3">
          {FIELD_PALETTE.map((field) => (
            <div
              key={field.id}
              className="flex cursor-grab items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent active:cursor-grabbing"
              draggable
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {field.icon}
              </div>
              <span className="text-sm font-medium">{field.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Center: PDF Canvas */}
      <div className="flex flex-1 flex-col bg-muted/30">
        <div className="flex items-center justify-between border-b bg-background px-4 py-2">
          <span className="text-sm font-medium">문서 편집기</span>
          <span className="text-xs text-muted-foreground">
            페이지 1 / 1
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center p-8">
          <div className="flex aspect-[210/297] w-full max-w-[595px] flex-col items-center justify-center rounded-sm border-2 border-dashed border-muted-foreground/20 bg-white shadow-sm dark:bg-zinc-900">
            <FileText className="size-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg font-medium text-muted-foreground/50">
              PDF 미리보기
            </p>
            <p className="mt-1 text-sm text-muted-foreground/40">
              필드를 여기에 드래그하여 배치하세요
            </p>
          </div>
        </div>
      </div>

      {/* Right: Field Properties */}
      <div className="flex w-64 shrink-0 flex-col border-l bg-background">
        <div className="border-b p-4">
          <h3 className="text-sm font-semibold">필드 속성</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            필드를 선택하면 속성을 편집할 수 있습니다
          </p>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-xs text-muted-foreground">
                선택된 필드 없음
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">
                문서 위의 필드를 클릭하여 속성을 수정하세요.
              </p>
            </CardContent>
          </Card>

          <Separator />

          {/* Placeholder property inputs */}
          <div className="flex flex-col gap-3 opacity-50">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">필드 이름</Label>
              <Input placeholder="예: 서명란" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">서명자 지정</Label>
              <Input placeholder="서명자 선택" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">X 좌표</Label>
              <Input type="number" placeholder="0" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Y 좌표</Label>
              <Input type="number" placeholder="0" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">너비</Label>
              <Input type="number" placeholder="200" disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">높이</Label>
              <Input type="number" placeholder="60" disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { TemplateEditorPlaceholder }
