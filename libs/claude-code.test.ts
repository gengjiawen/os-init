import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { writeClaudeConfig } from './claude-code'

function getVSCodeUserSettingsPath(homeDir: string): string {
  if (process.platform === 'darwin') {
    return path.join(
      homeDir,
      'Library',
      'Application Support',
      'Code',
      'User',
      'settings.json'
    )
  }

  if (process.platform === 'win32') {
    return path.join(
      homeDir,
      'AppData',
      'Roaming',
      'Code',
      'User',
      'settings.json'
    )
  }

  return path.join(homeDir, '.config', 'Code', 'User', 'settings.json')
}

describe('writeClaudeConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-claude-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes Claude settings and updates VSCode Claude plugin settings', () => {
    const vscodeSettingsPath = getVSCodeUserSettingsPath(tempHome)
    fs.mkdirSync(path.dirname(vscodeSettingsPath), { recursive: true })
    fs.writeFileSync(
      vscodeSettingsPath,
      '{\n  // keep existing setting\n  "editor.fontSize": 14,\n}\n'
    )

    const result = writeClaudeConfig('test-api-key')

    expect(result.settingsPath).toBe(
      path.join(tempHome, '.claude', 'settings.json')
    )
    expect(result.vscodeSettingsPath).toBe(vscodeSettingsPath)

    const claudeSettings = fs.readFileSync(result.settingsPath, 'utf8')
    expect(claudeSettings).toContain('"ANTHROPIC_API_KEY": "test-api-key"')
    expect(claudeSettings).toContain(
      '"ANTHROPIC_BASE_URL": "https://ai.gengjiawen.com/api/claude/"'
    )

    const vscodeSettings = fs.readFileSync(result.vscodeSettingsPath, 'utf8')
    expect(vscodeSettings).toContain('"editor.fontSize": 14')
    expect(vscodeSettings).toContain('"claudeCode.environmentVariables"')
    expect(vscodeSettings).toContain('"ANTHROPIC_BASE_URL"')
    expect(vscodeSettings).toContain('"ANTHROPIC_AUTH_TOKEN"')
    expect(vscodeSettings).toContain('"test-api-key"')
  })

  test('throws when existing VSCode settings is invalid', () => {
    const vscodeSettingsPath = getVSCodeUserSettingsPath(tempHome)
    fs.mkdirSync(path.dirname(vscodeSettingsPath), { recursive: true })
    fs.writeFileSync(vscodeSettingsPath, '{ invalid')

    expect(() => writeClaudeConfig('test-api-key')).toThrow(
      `VSCode settings is not valid JSONC: ${vscodeSettingsPath}. Please fix it and retry.`
    )
  })
})
