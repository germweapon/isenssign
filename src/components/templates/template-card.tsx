"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import {
  FileText,
  Copy,
  Archive,
  Send,
  MoreVertical,
  Pencil,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TemplateCardProps {
  id: string
  name: string
  authorName: string
  authorInitials: string
  createdAt: Date
  submissionCount: number
  onEdit?: (id: string) => void
  onDuplicate?: (id: string) => void
  onArchive?: (id: string) => void
  onRequestSign?: (id: string) => void
  onClick?: (id: string) => void
}

function TemplateCard({
  id,
  name,
  authorName,
  authorInitials,
  createdAt,
  submissionCount,
  onEdit,
  onDuplicate,
  onArchive,
  onRequestSign,
  onClick,
}: TemplateCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => {
        // 메뉴가 열려있을 때는 카드 클릭 무시
        if (menuOpen) return
        onClick?.(id)
      }}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="size-5 text-muted-foreground" />
          </div>
          <CardTitle className="truncate text-sm">{name}</CardTitle>
        </div>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              />
            }
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                onEdit?.(id)
              }}
            >
              <Pencil />
              편집
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onDuplicate?.(id)
              }}
            >
              <Copy />
              복제
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onArchive?.(id)
              }}
            >
              <Archive />
              보관
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                onRequestSign?.(id)
              }}
            >
              <Send />
              서명 요청
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{authorName}</span>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {format(createdAt, "yyyy년 M월 d일", { locale: ko })}
        </span>
        <Badge variant="secondary">{submissionCount}건 제출</Badge>
      </CardFooter>
    </Card>
  )
}

export { TemplateCard }
export type { TemplateCardProps }
