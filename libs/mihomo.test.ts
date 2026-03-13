import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { writeMihomoConfig } from './mihomo'

describe('writeMihomoConfig', () => {
  let tempHome: string
  let tempCwd: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>
  let cwdSpy: jest.SpiedFunction<typeof process.cwd>
  let originalAppData: string | undefined

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-mihomo-'))
    tempCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-mihomo-cwd-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
    cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(tempCwd)
    originalAppData = process.env.APPDATA
    process.env.APPDATA = path.join(tempHome, 'AppData', 'Roaming')
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    cwdSpy.mockRestore()
    if (originalAppData === undefined) {
      delete process.env.APPDATA
    } else {
      process.env.APPDATA = originalAppData
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
})
