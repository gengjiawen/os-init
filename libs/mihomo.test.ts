import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { gzipSync } from 'zlib'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

jest.mock('@gengjiawen/unzip-url', () => ({
  unzip: jest.fn(),
}))

import { unzip } from '@gengjiawen/unzip-url'
import { downloadMihomoBinary, writeMihomoConfig } from './mihomo'

describe('writeMihomoConfig', () => {
  let tempHome: string
  let tempCwd: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>
  let cwdSpy: jest.SpiedFunction<typeof process.cwd>
  let originalPlatformDescriptor: PropertyDescriptor | undefined
  let originalArchDescriptor: PropertyDescriptor | undefined
  let originalFetch: typeof global.fetch | undefined
  let originalAppData: string | undefined
  const unzipMock = unzip as jest.MockedFunction<typeof unzip>

  function setProcessRuntime(
    platform: NodeJS.Platform,
    arch: NodeJS.Architecture
  ): void {
    Object.defineProperty(process, 'platform', {
      configurable: true,
      value: platform,
    })
    Object.defineProperty(process, 'arch', {
      configurable: true,
      value: arch,
    })
  }

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-mihomo-'))
    tempCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-mihomo-cwd-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempCwd)
    originalPlatformDescriptor = Object.getOwnPropertyDescriptor(
      process,
      'platform'
    )
    originalArchDescriptor = Object.getOwnPropertyDescriptor(process, 'arch')
    originalFetch = global.fetch
    originalAppData = process.env.APPDATA
    process.env.APPDATA = path.join(tempHome, 'AppData', 'Roaming')
    unzipMock.mockReset()
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    cwdSpy.mockRestore()
    if (originalAppData === undefined) {
      delete process.env.APPDATA
    } else {
      process.env.APPDATA = originalAppData
    }
    if (originalPlatformDescriptor) {
      Object.defineProperty(process, 'platform', originalPlatformDescriptor)
    }
    if (originalArchDescriptor) {
      Object.defineProperty(process, 'arch', originalArchDescriptor)
    }
    if (originalFetch === undefined) {
      global.fetch = undefined as unknown as typeof global.fetch
    } else {
      global.fetch = originalFetch
    }
    fs.rmSync(tempHome, { recursive: true, force: true })
    fs.rmSync(tempCwd, { recursive: true, force: true })
  })

  test('writes default mihomo config.yml to current directory', () => {
    const result = writeMihomoConfig()

    expect(result.configPath).toBe(path.join(tempCwd, 'config.yml'))

    const content = fs.readFileSync(result.configPath, 'utf8')
    expect(content).toContain('mixed-port: 7890')
    expect(content).toContain('mode: rule')
    expect(content).toContain('type: socks5')
    expect(content).toContain('name: socks5-proxy')
    expect(content).toContain('server: your.ip')
    expect(content).toContain('port: 6153')
    expect(content).toContain('proxy-groups:')
    expect(content).toContain('- name: PROXY')
    expect(content).toContain('- socks5-proxy')
    expect(content).toContain('auto-detect-interface: true')
    expect(content).toContain('- IP-CIDR,127.0.0.0/8,DIRECT')
    expect(content).toContain('- IP-CIDR,10.0.0.0/8,DIRECT')
    expect(content).toContain('- IP-CIDR,172.16.0.0/12,DIRECT')
    expect(content).toContain('- IP-CIDR,192.168.0.0/16,DIRECT')
    expect(content).toContain('- IP-CIDR,169.254.0.0/16,DIRECT')
    expect(content).toContain('- IP-CIDR,100.64.0.0/10,DIRECT')
    expect(content).toContain('- IP-CIDR6,fc00::/7,DIRECT')
    expect(content).toContain('- IP-CIDR6,fe80::/10,DIRECT')
    expect(content).toContain('- DOMAIN-SUFFIX,local,DIRECT')
    expect(content).toContain('- DOMAIN-SUFFIX,cn,DIRECT')
    expect(content).toContain('- GEOIP,CN,DIRECT')
    expect(content).toContain('- MATCH,PROXY')
  })

  test('writes mihomo config to custom target path', () => {
    const customPath = path.join(tempHome, 'custom', 'mihomo.yml')
    const result = writeMihomoConfig(customPath)

    expect(result.configPath).toBe(customPath)
    expect(fs.existsSync(customPath)).toBe(true)
  })

  test('downloads linux mihomo binary and prefers v3 without go tag', async () => {
    const targetDir = path.join(tempCwd, 'mihomo-bin')
    const fetchMock = jest.fn()
    const binaryContent = Buffer.from('#!/bin/sh\necho mihomo\n', 'utf8')

    setProcessRuntime('linux', 'x64')

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v1.19.13',
          assets: [
            {
              name: 'mihomo-linux-amd64-v1-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v1-v1.19.13.gz',
            },
            {
              name: 'mihomo-linux-amd64-v2-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v2-v1.19.13.gz',
            },
            {
              name: 'mihomo-linux-amd64-v3-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v3-v1.19.13.gz',
            },
            {
              name: 'mihomo-linux-amd64-v3-go120-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v3-go120-v1.19.13.gz',
            },
            {
              name: 'mihomo-linux-amd64-v3-go123-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v3-go123-v1.19.13.gz',
            },
            {
              name: 'mihomo-linux-amd64-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v1.19.13.gz',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => gzipSync(binaryContent),
      })

    global.fetch = fetchMock as unknown as typeof global.fetch

    const result = await downloadMihomoBinary(targetDir)

    expect(result.version).toBe('v1.19.13')
    expect(result.binaryPath).toBe(path.join(targetDir, 'mihomo'))
    expect(result.downloadUrl).toBe(
      'https://example.com/mihomo-linux-amd64-v3-v1.19.13.gz'
    )
    expect(fs.existsSync(result.binaryPath)).toBe(true)
    expect(fs.readFileSync(result.binaryPath)).toEqual(binaryContent)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('downloads darwin mihomo binary and selects darwin asset', async () => {
    const targetDir = path.join(tempCwd, 'mihomo-darwin-bin')
    const fetchMock = jest.fn()
    const binaryContent = Buffer.from('#!/bin/sh\necho mihomo-darwin\n', 'utf8')

    setProcessRuntime('darwin', 'x64')

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v1.19.13',
          assets: [
            {
              name: 'mihomo-linux-amd64-v3-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-linux-amd64-v3-v1.19.13.gz',
            },
            {
              name: 'mihomo-darwin-amd64-v3-go123-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-darwin-amd64-v3-go123-v1.19.13.gz',
            },
            {
              name: 'mihomo-darwin-amd64-v2-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-darwin-amd64-v2-v1.19.13.gz',
            },
            {
              name: 'mihomo-darwin-amd64-v3-v1.19.13.gz',
              browser_download_url:
                'https://example.com/mihomo-darwin-amd64-v3-v1.19.13.gz',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => gzipSync(binaryContent),
      })

    global.fetch = fetchMock as unknown as typeof global.fetch

    const result = await downloadMihomoBinary(targetDir)

    expect(result.version).toBe('v1.19.13')
    expect(result.binaryPath).toBe(path.join(targetDir, 'mihomo'))
    expect(result.downloadUrl).toBe(
      'https://example.com/mihomo-darwin-amd64-v3-v1.19.13.gz'
    )
    expect(fs.existsSync(result.binaryPath)).toBe(true)
    expect(fs.readFileSync(result.binaryPath)).toEqual(binaryContent)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  test('downloads windows mihomo binary and extracts zip asset', async () => {
    const targetDir = path.join(tempCwd, 'mihomo-windows-bin')
    const fetchMock = jest.fn()
    const binaryContent = Buffer.from('windows-mihomo', 'utf8')

    setProcessRuntime('win32', 'x64')

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tag_name: 'v1.19.13',
        assets: [
          {
            name: 'mihomo-linux-amd64-v3-v1.19.13.gz',
            browser_download_url:
              'https://example.com/mihomo-linux-amd64-v3-v1.19.13.gz',
          },
          {
            name: 'mihomo-windows-amd64-go123-v1.19.13.zip',
            browser_download_url:
              'https://example.com/mihomo-windows-amd64-go123-v1.19.13.zip',
          },
          {
            name: 'mihomo-windows-amd64-v1.19.13.zip',
            browser_download_url:
              'https://example.com/mihomo-windows-amd64-v1.19.13.zip',
          },
        ],
      }),
    })

    unzipMock.mockImplementation(async (_url, destination) => {
      const nestedDir = path.join(destination, 'nested')
      fs.mkdirSync(nestedDir, { recursive: true })
      fs.writeFileSync(path.join(nestedDir, 'mihomo.exe'), binaryContent)
    })

    global.fetch = fetchMock as unknown as typeof global.fetch

    const result = await downloadMihomoBinary(targetDir)

    expect(result.version).toBe('v1.19.13')
    expect(result.binaryPath).toBe(path.join(targetDir, 'mihomo.exe'))
    expect(result.downloadUrl).toBe(
      'https://example.com/mihomo-windows-amd64-v1.19.13.zip'
    )
    expect(fs.existsSync(result.binaryPath)).toBe(true)
    expect(fs.readFileSync(result.binaryPath)).toEqual(binaryContent)
    expect(unzipMock).toHaveBeenCalledWith(
      'https://example.com/mihomo-windows-amd64-v1.19.13.zip',
      expect.any(String)
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
