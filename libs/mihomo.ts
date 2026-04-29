import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { gunzipSync } from 'zlib'
import { unzip } from '@gengjiawen/unzip-url'
import { ensureDir } from './utils'

const MIHOMO_CONFIG_TEMPLATE = `mixed-port: 7890
mode: rule
log-level: info
dns:
  enable: true
  ipv6: false
  default-nameserver:
    - 1.1.1.1
    - 223.5.5.5
    - 119.29.29.29
sniffer:
  enable: true
  sniffing:
    - tls
    - http
tun:
  enable: true
  stack: system
  auto-route: true
  auto-redirect: true
  auto-detect-interface: true
proxies:
  - name: socks5-proxy
    type: socks5
    server: your.ip
    port: 6153
proxy-groups:
  - name: PROXY
    type: select
    proxies:
      - socks5-proxy
rules:
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,169.254.0.0/16,DIRECT
  - IP-CIDR,100.64.0.0/10,DIRECT
  - IP-CIDR6,fc00::/7,DIRECT
  - IP-CIDR6,fe80::/10,DIRECT
  - DOMAIN-SUFFIX,local,DIRECT
  - DOMAIN-SUFFIX,cn,DIRECT
  # - GEOIP,CN,DIRECT
  - MATCH,PROXY
`

const MIHOMO_LATEST_RELEASE_API_URL =
  'https://api.github.com/repos/MetaCubeX/mihomo/releases/latest'

interface MihomoReleaseAsset {
  name: string
  browser_download_url: string
}

interface MihomoRelease {
  tag_name: string
  assets: MihomoReleaseAsset[]
}

function getMihomoBinaryFilename(platform = process.platform): string {
  return platform === 'win32' ? 'mihomo.exe' : 'mihomo'
}

function getMihomoPlatformToken(platform = process.platform): string {
  switch (platform) {
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'darwin'
    case 'win32':
      return 'windows'
    default:
      throw new Error(`Unsupported platform for Mihomo download: ${platform}`)
  }
}

function getMihomoArchTokens(arch = process.arch): string[] {
  switch (arch) {
    case 'x64':
      return ['amd64']
    case 'arm64':
      return ['arm64-v8', 'arm64']
    case 'arm':
      return ['armv7', 'arm']
    case 'ia32':
      return ['386']
    default:
      throw new Error(`Unsupported architecture for Mihomo download: ${arch}`)
  }
}

function getMihomoCpuLevelTokens(
  platform = process.platform,
  arch = process.arch
): string[] {
  if (platform !== 'linux' && platform !== 'darwin') {
    return []
  }

  if (arch !== 'x64') {
    return []
  }

  return ['v3', 'v2', 'v1']
}

function findMihomoAsset(
  assets: MihomoReleaseAsset[],
  platform = process.platform,
  arch = process.arch
): MihomoReleaseAsset {
  const platformToken = getMihomoPlatformToken(platform)
  const archTokens = getMihomoArchTokens(arch)
  const cpuLevelTokens = getMihomoCpuLevelTokens(platform, arch)
  const extension = platform === 'win32' ? '.zip' : '.gz'

  const candidates = assets.filter(
    (asset) =>
      asset.name.startsWith(`mihomo-${platformToken}-`) &&
      asset.name.endsWith(extension)
  )

  const sortCandidates = (
    left: MihomoReleaseAsset,
    right: MihomoReleaseAsset
  ): number => {
    const leftHasGoTag = left.name.includes('-go')
    const rightHasGoTag = right.name.includes('-go')

    if (leftHasGoTag !== rightHasGoTag) {
      return leftHasGoTag ? 1 : -1
    }

    const leftCompatible = left.name.includes('compatible')
    const rightCompatible = right.name.includes('compatible')

    if (leftCompatible !== rightCompatible) {
      return leftCompatible ? 1 : -1
    }

    return left.name.localeCompare(right.name)
  }

  for (const archToken of archTokens) {
    const archMatches = candidates.filter((asset) =>
      asset.name.includes(`-${archToken}-`)
    )

    if (archMatches.length === 0) {
      continue
    }

    for (const cpuLevelToken of cpuLevelTokens) {
      const cpuMatches = archMatches
        .filter((asset) => asset.name.includes(`-${cpuLevelToken}-`))
        .sort(sortCandidates)

      if (cpuMatches.length > 0) {
        return cpuMatches[0]
      }
    }

    const fallbackMatches = archMatches.sort(sortCandidates)

    if (fallbackMatches.length > 0) {
      return fallbackMatches[0]
    }
  }

  throw new Error(
    `No Mihomo binary found for platform ${platform} and architecture ${arch}.`
  )
}

function findFileRecursively(rootDir: string, matcher: RegExp): string | null {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)

    if (entry.isDirectory()) {
      const nested = findFileRecursively(fullPath, matcher)
      if (nested) return nested
      continue
    }

    if (matcher.test(entry.name)) {
      return fullPath
    }
  }

  return null
}

async function fetchMihomoLatestRelease(): Promise<MihomoRelease> {
  const response = await fetch(MIHOMO_LATEST_RELEASE_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': '@gengjiawen/os-init',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Mihomo release metadata: ${response.status} ${response.statusText}`
    )
  }

  return (await response.json()) as MihomoRelease
}

export async function downloadMihomoBinary(targetDir: string): Promise<{
  binaryPath: string
  downloadUrl: string
  version: string
}> {
  ensureDir(targetDir)

  const release = await fetchMihomoLatestRelease()
  const asset = findMihomoAsset(release.assets)
  const binaryPath = path.join(targetDir, getMihomoBinaryFilename())

  if (process.platform === 'win32') {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-mihomo-'))

    try {
      await unzip(asset.browser_download_url, tempDir)
      const extractedBinary = findFileRecursively(tempDir, /^mihomo.*\.exe$/i)

      if (!extractedBinary) {
        throw new Error(
          `Mihomo executable was not found in asset ${asset.name}.`
        )
      }

      fs.copyFileSync(extractedBinary, binaryPath)
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  } else {
    const response = await fetch(asset.browser_download_url, {
      headers: {
        Accept: 'application/octet-stream',
        'User-Agent': '@gengjiawen/os-init',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to download Mihomo binary: ${response.status} ${response.statusText}`
      )
    }

    const compressedBinary = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(binaryPath, gunzipSync(compressedBinary))
    fs.chmodSync(binaryPath, 0o755)
  }

  return {
    binaryPath,
    downloadUrl: asset.browser_download_url,
    version: release.tag_name,
  }
}

/** Write Mihomo config.yml */
export function writeMihomoConfig(targetPath?: string): { configPath: string } {
  const configPath = targetPath || path.join(process.cwd(), 'config.yml')
  ensureDir(path.dirname(configPath))
  fs.writeFileSync(configPath, MIHOMO_CONFIG_TEMPLATE)

  return { configPath }
}
