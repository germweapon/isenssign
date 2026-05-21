#!/usr/bin/env node
/**
 * PDF 텍스트 추출 스크립트 (독립 프로세스)
 * Next.js/Turbopack 번들링 문제를 우회하기 위해 child_process로 실행
 *
 * Usage: node scripts/pdf-extract.mjs <pdf-path>
 * Output: JSON to stdout
 */
import { readFileSync } from "fs";

// worker를 메인 스레드에서 로드
await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

const pdfPath = process.argv[2];
if (!pdfPath) {
  process.stderr.write("Usage: node pdf-extract.mjs <pdf-path>\n");
  process.exit(1);
}

const buf = readFileSync(pdfPath);
const data = new Uint8Array(buf);
const doc = await pdfjsLib.getDocument({ data }).promise;

const result = {
  pageCount: doc.numPages,
  textBlocks: [],
  pageDimensions: [],
};

let blockIndex = 0;

for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });

  result.pageDimensions.push({
    width: viewport.width,
    height: viewport.height,
  });

  const textContent = await page.getTextContent();

  // 인접한 텍스트 아이템을 라인으로 그룹핑
  let currentLine = null;

  for (const item of textContent.items) {
    if (!item.str && !item.hasEOL) continue;

    const tx = item.transform;
    const fontSize = Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]);
    const x = tx[4];
    const y = viewport.height - tx[5] - fontSize;

    if (!item.str || !item.str.trim()) {
      if (item.hasEOL && currentLine) {
        result.textBlocks.push(currentLine);
        currentLine = null;
      }
      continue;
    }

    if (
      currentLine &&
      Math.abs(y - currentLine.y) < fontSize * 0.5
    ) {
      // 같은 줄
      currentLine.content += item.str;
      const right = x + item.width;
      currentLine.width = Math.max(currentLine.width, right - currentLine.x);
      currentLine.height = Math.max(currentLine.height, fontSize);
    } else {
      if (currentLine) {
        result.textBlocks.push(currentLine);
      }
      currentLine = {
        id: `tb-${pageNum}-${blockIndex++}`,
        pageIndex: pageNum - 1,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        width: Math.round(item.width * 100) / 100,
        height: Math.round(fontSize * 100) / 100,
        content: item.str,
        fontSize: Math.round(fontSize),
        fontFamily: item.fontName || "sans-serif",
        fontWeight: (item.fontName || "").toLowerCase().includes("bold") ? "bold" : "normal",
        fontStyle: (item.fontName || "").toLowerCase().includes("italic") ? "italic" : "normal",
        color: "#000000",
        textAlign: "left",
        isOriginal: true,
      };
    }

    if (item.hasEOL && currentLine) {
      result.textBlocks.push(currentLine);
      currentLine = null;
    }
  }

  if (currentLine) {
    result.textBlocks.push(currentLine);
  }

  page.cleanup();
}

await doc.destroy();
process.stdout.write(JSON.stringify(result));
