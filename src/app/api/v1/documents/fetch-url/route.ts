/**
 * Document Fetch-URL API
 * POST /api/v1/documents/fetch-url
 *
 * URL에서 문서를 가져와 배경이미지 + 텍스트 오버레이로 변환
 * 지원: Google Docs, Google Sheets, 직접 파일 URL (.docx, .xlsx, .xls, .pptx, .pdf)
 * 최대 응답 크기: 10MB
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { z } from "zod";
import { convertToPdf } from "@/lib/libreoffice";
import { renderPdfPages } from "@/lib/pdf-page-renderer";
import { extractTextBlocks } from "@/lib/pdf-text-extract";
import type { TextBlock } from "@/lib/text-block";

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB
const FETCH_TIMEOUT_MS = 30_000; // 30초

type SourceType = "docx" | "xlsx" | "pdf" | "pptx" | "gdoc" | "gsheet";

const FetchUrlSchema = z.object({
  url: z.string().url("올바른 URL을 입력해주세요"),
});

// ---------------------------------------------------------------------------
// URL 파싱 유틸리티
// ---------------------------------------------------------------------------

interface GoogleUrlInfo {
  type: "gdoc" | "gsheet";
  exportUrl: string;
}

function parseGoogleUrl(url: string): GoogleUrlInfo | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("google.com")) return null;

    // Google Docs: /document/d/{ID}(/edit|/view|...)
    const docMatch = u.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (docMatch) {
      return {
        type: "gdoc",
        exportUrl: `https://docs.google.com/document/d/${docMatch[1]}/export?format=docx`,
      };
    }

    // Google Sheets: /spreadsheets/d/{ID}(/edit|/view|...)
    const sheetMatch = u.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (sheetMatch) {
      return {
        type: "gsheet",
        exportUrl: `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

type FileType = "docx" | "xlsx" | "pptx" | "pdf";

function getFileTypeFromUrl(url: string): FileType | null {
  try {
    const u = new URL(url);
    const p = u.pathname.toLowerCase();
    if (p.endsWith(".docx")) return "docx";
    if (p.endsWith(".xlsx") || p.endsWith(".xls")) return "xlsx";
    if (p.endsWith(".pptx")) return "pptx";
    if (p.endsWith(".pdf")) return "pdf";
    return null;
  } catch {
    return null;
  }
}

function extractFileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.includes(".")) {
      return last;
    }
    return "document";
  } catch {
    return "document";
  }
}

// ---------------------------------------------------------------------------
// 원격 파일 가져오기
// ---------------------------------------------------------------------------

class FetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

/** 내부 네트워크 접근 방지 (SSRF) */
function validateUrlSafety(url: string): void {
  const u = new URL(url);

  // https/http만 허용
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    throw new FetchError("https 또는 http URL만 지원합니다.", 400);
  }

  const hostname = u.hostname.toLowerCase();

  // localhost / loopback 차단
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  ) {
    throw new FetchError("내부 네트워크 주소는 접근할 수 없습니다.", 400);
  }

  // 사설 IP 대역 차단 (10.x, 172.16-31.x, 192.168.x, 169.254.x)
  const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    ) {
      throw new FetchError("내부 네트워크 주소는 접근할 수 없습니다.", 400);
    }
  }
}

async function fetchRemote(
  url: string
): Promise<{ buffer: Buffer; contentType: string }> {
  validateUrlSafety(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
    });

    if (!response.ok) {
      switch (response.status) {
        case 401:
        case 403:
          throw new FetchError(
            "문서가 공개 설정되어 있지 않습니다. '링크가 있는 모든 사용자에게 공개'로 설정해주세요.",
            403
          );
        case 404:
          throw new FetchError(
            "문서를 찾을 수 없습니다. URL이 올바른지 확인해주세요.",
            404
          );
        default:
          throw new FetchError(
            `문서를 가져오는 중 오류가 발생했습니다 (HTTP ${response.status})`,
            response.status
          );
      }
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
      throw new FetchError(
        `문서 크기가 10MB를 초과합니다 (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`,
        400
      );
    }

    const contentType = response.headers.get("content-type") || "";
    return { buffer: Buffer.from(arrayBuffer), contentType };
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// 공통 변환 파이프라인
// ---------------------------------------------------------------------------

async function convertBufferToResult(
  fileBuffer: Buffer,
  fileName: string,
  sourceType: SourceType,
  tmpDir: string,
) {
  const needsLibreOffice = sourceType !== "pdf";
  let pdfBuffer: Buffer;

  if (needsLibreOffice) {
    const tmpFilePath = path.join(tmpDir, fileName);
    await fs.writeFile(tmpFilePath, fileBuffer);
    const pdfPath = await convertToPdf(tmpFilePath, tmpDir);
    pdfBuffer = await fs.readFile(pdfPath);
  } else {
    pdfBuffer = fileBuffer;
  }

  const pdfData = new Uint8Array(pdfBuffer);
  const storagePrefix = `documents/${nanoid(12)}`;

  const [renderedPages, textResult] = await Promise.all([
    renderPdfPages(pdfData, storagePrefix),
    extractTextBlocks(pdfData),
  ]);

  const pages = renderedPages.map((p) => ({
    pageIndex: p.pageIndex,
    width: p.width,
    height: p.height,
    imageUrl: p.imageUrl,
  }));

  return {
    pages,
    textBlocks: textResult.textBlocks,
    sourceType,
    fileName,
    totalPages: textResult.pageCount,
  };
}

// ---------------------------------------------------------------------------
// 메인 핸들러
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let tmpDir: string | null = null;

  try {
    const session = await requireAuth();
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const parsed = FetchUrlSchema.safeParse(body);

    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const firstMsg = flat.fieldErrors.url?.[0];
      return NextResponse.json(
        { error: firstMsg || "잘못된 요청입니다", details: flat },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    // 임시 디렉터리 생성
    const tmpId = nanoid();
    tmpDir = path.join("/tmp", `isens-${tmpId}`);
    await fs.mkdir(tmpDir, { recursive: true });

    // 1) Google Docs / Sheets
    const googleInfo = parseGoogleUrl(url);
    if (googleInfo) {
      const { buffer } = await fetchRemote(googleInfo.exportUrl);
      const isDoc = googleInfo.type === "gdoc";
      const sourceType: SourceType = googleInfo.type;
      const ext = isDoc ? ".docx" : ".xlsx";
      const tmpFileName = `document${ext}`;

      const result = await convertBufferToResult(
        buffer,
        tmpFileName,
        sourceType,
        tmpDir,
      );

      return NextResponse.json({
        ...result,
        fileName: "document",
        sourceType,
      });
    }

    // 2) 직접 파일 URL (.docx, .xlsx, .xls, .pptx, .pdf)
    const fileType = getFileTypeFromUrl(url);
    if (fileType) {
      const { buffer } = await fetchRemote(url);
      const fileName = extractFileNameFromUrl(url);

      const result = await convertBufferToResult(
        buffer,
        fileName,
        fileType,
        tmpDir,
      );

      return NextResponse.json(result);
    }

    // 3) 지원하지 않는 URL
    return NextResponse.json(
      {
        error:
          "지원하지 않는 URL 형식입니다. Google Docs, Google Sheets 링크 또는 .docx, .xlsx, .pptx, .pdf 파일 URL을 입력해주세요.",
      },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof FetchError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "문서를 가져오는 데 시간이 너무 오래 걸립니다 (30초 초과)" },
        { status: 408 }
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "문서를 가져오는 중 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (tmpDir) {
      fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
