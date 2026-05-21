#!/usr/bin/env node
/**
 * PDF 페이지 이미지 렌더링 스크립트 (독립 프로세스)
 * pdftoppm (poppler) 사용 — pdfjs + node-canvas 호환 문제 완전 우회
 *
 * Usage: node scripts/pdf-render.mjs <pdf-path> <output-dir>
 * Output: JSON to stdout with rendered page info
 *
 * 필요: poppler (macOS: brew install poppler, Docker: apt-get install poppler-utils)
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { execFileSync } from "child_process";

const RENDER_DPI = 144; // 2x 스케일 (72dpi * 2)

const pdfPath = process.argv[2];
const outputDir = process.argv[3];

if (!pdfPath || !outputDir) {
  process.stderr.write(
    "Usage: node pdf-render.mjs <pdf-path> <output-dir>\n",
  );
  process.exit(1);
}

// pdftoppm 경로 탐색
const pdftoppmPaths = [
  process.env.PDFTOPPM_PATH,
  "/opt/homebrew/bin/pdftoppm",
  "/usr/bin/pdftoppm",
  "/usr/local/bin/pdftoppm",
  "pdftoppm",
].filter(Boolean);

let pdftoppm = null;
for (const p of pdftoppmPaths) {
  try {
    execFileSync(p, ["-v"], { stdio: "pipe" });
    pdftoppm = p;
    break;
  } catch {
    continue;
  }
}

if (!pdftoppm) {
  process.stderr.write(
    "pdftoppm not found. Install poppler:\n" +
      "  macOS: brew install poppler\n" +
      "  Docker: apt-get install -y poppler-utils\n",
  );
  process.exit(1);
}

// PDF 페이지 수 + 크기 정보 (pdfinfo 사용)
const pdfinfoPath = pdftoppm.replace("pdftoppm", "pdfinfo");
let pageCount = 0;
let pageWidth = 595;
let pageHeight = 842;

try {
  const info = execFileSync(pdfinfoPath, [pdfPath], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const pagesMatch = info.match(/Pages:\s+(\d+)/);
  if (pagesMatch) pageCount = parseInt(pagesMatch[1], 10);

  const sizeMatch = info.match(/Page size:\s+([\d.]+)\s+x\s+([\d.]+)/);
  if (sizeMatch) {
    pageWidth = parseFloat(sizeMatch[1]);
    pageHeight = parseFloat(sizeMatch[2]);
  }
} catch {
  // pdfinfo 실패 시 기본값 사용
}

// pdftoppm으로 PNG 렌더링
execFileSync(
  pdftoppm,
  ["-png", "-r", String(RENDER_DPI), pdfPath, join(outputDir, "page")],
  { timeout: 120_000 },
);

// 생성된 파일 목록 (page-01.png, page-02.png, ...)
const files = readdirSync(outputDir)
  .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
  .sort();

if (files.length === 0) {
  process.stderr.write("No pages rendered\n");
  process.exit(1);
}

// 각 페이지별 크기 정보 추출 (pdfinfo에서 per-page 크기를 못 가져오면 기본값 사용)
// 개별 페이지 크기가 필요하면 별도 처리
const pages = files.map((filename, index) => ({
  pageIndex: index,
  width: pageWidth,
  height: pageHeight,
  filename,
  filePath: join(outputDir, filename),
}));

process.stdout.write(JSON.stringify(pages));
