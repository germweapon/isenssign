import { getRequestConfig } from "next-intl/server"
import { readFileSync } from "fs"
import { join } from "path"
import { routing } from "./routing"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as "ko" | "en")) {
    locale = routing.defaultLocale
  }

  // Use fs.readFileSync to avoid Turbopack JSON import caching issues
  const messagesPath = join(process.cwd(), "messages", `${locale}.json`)
  const messages = JSON.parse(readFileSync(messagesPath, "utf-8"))

  return {
    locale,
    messages,
  }
})
