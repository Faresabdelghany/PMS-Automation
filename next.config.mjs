import { readFileSync } from "node:fs"

// Load .env.local manually to work around Turbopack env corruption
// (Turbopack's built-in .env.local parser corrupts long JWT values)
try {
  const envContent = readFileSync(".env.local", "utf8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx)
    let val = trimmed.slice(eqIdx + 1)
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    // Always override — Turbopack's parser corrupts long values
    process.env[key] = val
  }
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@phosphor-icons/react"],
  },
}

export default nextConfig
