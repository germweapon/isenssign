/**
 * PDF 페이지를 PNG 이미지로 렌더링 (서버 사이드)
 * pdfjs-dist + node-canvas를 child_process로 실행하여 Turbopack 번들링 문제 우회
 */
import { execFile } from "child_process"
import { promisify } from "util"
import { promises as fs } from "fs"
import path from "path"
import { getStorage } from "@/lib/storage"

const execFileAsync = promisify(execFile)

interface RenderedPage {
  pageIndex: number
  width: number
  height: number
  storageKey: string
  imageUrl: string
}

/**
 * PDF 전체 페이지를 PNG 이미지로 렌더링 후 스토리지에 저장
 */
export async function renderPdfPages(
  pdfData: Uint8Array,
  storagePrefix: string,
): Promise<RenderedPage[]> {
  const tmpPdfPath = path.join("/tmp", `isens-render-${Date.now()}.pdf`)
  const tmpOutputDir = path.join("/tmp", `isens-pages-${Date.now()}`)

  try {
    await fs.writeFile(tmpPdfPath, Buffer.from(pdfData))
    await fs.mkdir(tmpOutputDir, { recursive: true })

    const scriptPath = path.resolve(process.cwd(), "scripts/pdf-render.mjs")

    const { stdout } = await execFileAsync(
      "node",
      [scriptPath, tmpPdfPath, tmpOutputDir],
      {
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
      },
    )

    const rawPages: Array<{
      pageIndex: number
      width: number
      height: number
      filename: string
      filePath: string
    }> = JSON.parse(stdout)

    const storage = getStorage()
    const pages: RenderedPage[] = []

    for (const rp of rawPages) {
      const pngBuffer = await fs.readFile(rp.filePath)
      const storageKey = `${storagePrefix}/page-${rp.pageIndex + 1}.png`
      await storage.upload(storageKey, pngBuffer, "image/png")

      pages.push({
        pageIndex: rp.pageIndex,
        width: rp.width,
        height: rp.height,
        storageKey,
        imageUrl: storage.getUrl(storageKey),
      })
    }

    return pages
  } finally {
    fs.unlink(tmpPdfPath).catch(() => {})
    fs.rm(tmpOutputDir, { recursive: true, force: true }).catch(() => {})
  }
}
