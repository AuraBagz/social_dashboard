import * as twitter from './twitter.ts'
import * as instagram from './instagram.ts'
import * as facebook from './facebook.ts'
import * as youtube from './youtube.ts'
import * as tiktok from './tiktok.ts'
import * as linkedin from './linkedin.ts'

export type PlatformAdapter = {
  verifyCredentials: (tokens: Record<string, string>) => Promise<Record<string, unknown>>
  getTimeline: (tokens: Record<string, string>, count?: number) => Promise<Array<Record<string, unknown>>>
  createPost: (tokens: Record<string, string>, text: string) => Promise<unknown>
  updateProfile: (tokens: Record<string, string>, profile: Record<string, string>) => Promise<unknown>
  requiredTokens: string[]
  tokenLabels: Record<string, string>
}

const platforms: Record<string, PlatformAdapter> = {
  twitter,
  instagram,
  facebook,
  youtube,
  tiktok,
  linkedin,
}

export function getPlatform(name: string): PlatformAdapter {
  const adapter = platforms[name]
  if (!adapter) throw new Error(`Unknown platform: ${name}`)
  return adapter
}

export function getAllPlatforms() {
  return Object.keys(platforms)
}

export function getTokenConfig() {
  const config: Record<string, { required: string[], labels: Record<string, string> }> = {}
  for (const [name, adapter] of Object.entries(platforms)) {
    config[name] = {
      required: adapter.requiredTokens,
      labels: adapter.tokenLabels,
    }
  }
  return config
}
