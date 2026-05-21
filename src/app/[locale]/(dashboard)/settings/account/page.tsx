"use client"

import * as React from "react"
import {
  User,
  Building2,
  Lock,
  Camera,
  Save,
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
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const timezones = [
  { value: "Asia/Seoul", label: "서울 (UTC+9)" },
  { value: "Asia/Tokyo", label: "도쿄 (UTC+9)" },
  { value: "America/New_York", label: "뉴욕 (UTC-5)" },
  { value: "America/Los_Angeles", label: "로스앤젤레스 (UTC-8)" },
  { value: "Europe/London", label: "런던 (UTC+0)" },
]

const languages = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
]

export default function AccountSettingsPage() {
  const [profileForm, setProfileForm] = React.useState({
    name: "",
    email: "",
  })

  const [companyForm, setCompanyForm] = React.useState({
    companyName: "",
    timezone: "Asia/Seoul",
    language: "ko",
  })

  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  return (
    <div className="space-y-6">
      {/* 프로필 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            프로필
          </CardTitle>
          <CardDescription>
            이름, 이메일, 아바타를 변경합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              JPG, PNG 파일. 최대 2MB.
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="홍길동"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="hong@example.com"
                value={profileForm.email}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            <Save className="h-4 w-4" data-icon="inline-start" />
            저장
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      {/* 계정 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            계정
          </CardTitle>
          <CardDescription>
            회사명, 시간대, 언어를 설정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">회사명</Label>
            <Input
              id="company"
              placeholder="주식회사 예시"
              value={companyForm.companyName}
              onChange={(e) =>
                setCompanyForm((prev) => ({
                  ...prev,
                  companyName: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">시간대</Label>
              <Select
                value={companyForm.timezone}
                onValueChange={(value) =>
                  setCompanyForm((prev) => ({ ...prev, timezone: value ?? prev.timezone }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="시간대 선택" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">언어</Label>
              <Select
                value={companyForm.language}
                onValueChange={(value) =>
                  setCompanyForm((prev) => ({ ...prev, language: value ?? prev.language }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            <Save className="h-4 w-4" data-icon="inline-start" />
            저장
          </Button>
        </CardFooter>
      </Card>

      <Separator />

      {/* 보안 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            보안
          </CardTitle>
          <CardDescription>
            비밀번호를 변경합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">현재 비밀번호</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            <Lock className="h-4 w-4" data-icon="inline-start" />
            비밀번호 변경
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
