/**
 * Webhooks API
 * GET  /api/v1/webhooks - 웹훅 URL 목록
 * POST /api/v1/webhooks - 웹훅 URL 등록
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

const WEBHOOK_EVENT_TYPES = [
  "submission.created",
  "submission.completed",
  "submission.expired",
  "submission.archived",
  "submitter.sent",
  "submitter.opened",
  "submitter.signed",
  "submitter.declined",
  "template.created",
  "template.archived",
] as const;

const CreateWebhookSchema = z.object({
  url: z.string().url("올바른 URL을 입력해주세요"),
  events: z.array(z.enum(WEBHOOK_EVENT_TYPES)).min(1, "최소 1개의 이벤트를 선택해주세요"),
  secret: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const webhooks = await prisma.webhookUrl.findMany({
      where: { accountId: session.user.accountId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: webhooks });
  } catch (error) {
    console.error("웹훅 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "웹훅 목록을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const parsed = CreateWebhookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhookUrl.create({
      data: {
        url: parsed.data.url,
        events: parsed.data.events,
        secret: parsed.data.secret || crypto.randomBytes(32).toString("hex"),
        accountId: session.user.accountId,
      },
    });

    return NextResponse.json({ data: webhook }, { status: 201 });
  } catch (error) {
    console.error("웹훅 생성 실패:", error);
    return NextResponse.json(
      { error: "웹훅을 생성하는데 실패했습니다" },
      { status: 500 }
    );
  }
}

/**
 * 웹훅 이벤트 발송 유틸리티
 */
export async function dispatchWebhookEvent(
  accountId: string,
  eventType: (typeof WEBHOOK_EVENT_TYPES)[number],
  payload: Record<string, unknown>
) {
  const webhooks = await prisma.webhookUrl.findMany({
    where: {
      accountId,
      enabled: true,
      events: { has: eventType },
    },
  });

  const results = await Promise.allSettled(
    webhooks.map(async (webhook: { id: string; url: string; secret: string | null }) => {
      const body = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      // HMAC 서명 생성
      const signature = webhook.secret
        ? crypto
            .createHmac("sha256", webhook.secret)
            .update(body)
            .digest("hex")
        : undefined;

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature && { "X-Webhook-Signature": `sha256=${signature}` }),
          "X-Webhook-Event": eventType,
        },
        body,
        signal: AbortSignal.timeout(10000), // 10초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`Webhook delivery failed: ${response.status}`);
      }

      return { webhookId: webhook.id, status: response.status };
    })
  );

  return results;
}
