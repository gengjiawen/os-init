import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { writeAllAgentsConfig } from './all-agents'

describe('writeAllAgentsConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>
  let originalAppData: string | undefined

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-all-agents-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
    originalAppData = process.env.APPDATA
    process.env.APPDATA = path.join(tempHome, 'AppData', 'Roaming')
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    if (originalAppData === undefined) {
      delete process.env.APPDATA
    } else {
      process.env.APPDATA = originalAppData
    }
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes Claude, Codex and OpenCode config by default', () => {
    const result = writeAllAgentsConfig('test-api-key')

    expect(fs.existsSync(result.claude.settingsPath)).toBe(true)
    expect(fs.existsSync(result.codex.configPath)).toBe(true)
    expect(fs.existsSync(result.codex.authPath)).toBe(true)
    expect(fs.existsSync(result.opencode.configPath)).toBe(true)
    expect(result.gemini).toBeUndefined()
  })

  test('includes Gemini config when full option is enabled', () => {
    const result = writeAllAgentsConfig('test-api-key', { full: true })

    expect(result.gemini).toBeDefined()
    expect(fs.existsSync(result.gemini!.envPath)).toBe(true)
    expect(fs.existsSync(result.gemini!.settingsPath)).toBe(true)
  })
})
