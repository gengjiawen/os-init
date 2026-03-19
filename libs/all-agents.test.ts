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
  let originalFetch: typeof global.fetch | undefined

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-all-agents-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
    originalAppData = process.env.APPDATA
    originalFetch = global.fetch
    process.env.APPDATA = path.join(tempHome, 'AppData', 'Roaming')
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ id: 'gpt-5.4' }] }),
    }) as unknown as typeof global.fetch
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    if (originalAppData === undefined) {
      delete process.env.APPDATA
    } else {
      process.env.APPDATA = originalAppData
    }
    if (originalFetch === undefined) {
      global.fetch = undefined as unknown as typeof global.fetch
    } else {
      global.fetch = originalFetch
    }
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes Claude, Codex and OpenCode config by default', async () => {
    const result = await writeAllAgentsConfig('test-api-key')

    expect(fs.existsSync(result.claude.settingsPath)).toBe(true)
    expect(fs.existsSync(result.codex.configPath)).toBe(true)
    expect(fs.existsSync(result.codex.authPath)).toBe(true)
    expect(fs.existsSync(result.codex.catalogPath)).toBe(true)
    expect(fs.existsSync(result.opencode.configPath)).toBe(true)
    expect(result.gemini).toBeUndefined()
  })

  test('includes Gemini config when full option is enabled', async () => {
    const result = await writeAllAgentsConfig('test-api-key', { full: true })

    expect(result.gemini).toBeDefined()
    expect(fs.existsSync(result.gemini!.envPath)).toBe(true)
    expect(fs.existsSync(result.gemini!.settingsPath)).toBe(true)
  })
})
