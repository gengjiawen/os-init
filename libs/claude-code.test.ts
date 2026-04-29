import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { writeClaudeConfig } from './claude-code'
import { installDeps } from './claude-code'
import { execa } from 'execa'

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
    const appData =
      process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming')
    return path.join(appData, 'Code', 'User', 'settings.json')
  }

  return path.join(homeDir, '.config', 'Code', 'User', 'settings.json')
}

describe('writeClaudeConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>
  let originalAppData: string | undefined

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-claude-'))
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
    expect(claudeSettings).toContain(
      '"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"'
    )
    expect(claudeSettings).toContain(
      '"CLAUDE_CODE_AUTO_COMPACT_WINDOW": "128000"'
    )
    expect(claudeSettings).toContain('"CLAUDE_CODE_DISABLE_1M_CONTEXT": "1"')

    const vscodeSettings = fs.readFileSync(result.vscodeSettingsPath, 'utf8')
    expect(vscodeSettings).toContain('"editor.fontSize": 14')
    expect(vscodeSettings).toContain('"claudeCode.environmentVariables"')
    expect(vscodeSettings).toContain('"ANTHROPIC_BASE_URL"')
    expect(vscodeSettings).toContain('"ANTHROPIC_AUTH_TOKEN"')
    expect(vscodeSettings).toContain(
      '"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"'
    )
    expect(vscodeSettings).toContain('"CLAUDE_CODE_AUTO_COMPACT_WINDOW"')
    expect(vscodeSettings).toContain('"128000"')
    expect(vscodeSettings).toContain('"CLAUDE_CODE_DISABLE_1M_CONTEXT"')
    expect(vscodeSettings).toContain('"1"')
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

  test('allows Claude postinstall build when installing with pnpm', async () => {
    const execaMock = jest.mocked(execa)
    execaMock
      .mockResolvedValueOnce({ failed: false } as never)
      .mockResolvedValueOnce({} as never)

    await installDeps()

    expect(execaMock).toHaveBeenNthCalledWith(1, 'pnpm', ['--version'], {
      stdio: 'ignore',
      reject: false,
    })
    expect(execaMock).toHaveBeenNthCalledWith(
      2,
      'pnpm',
      [
        '--allow-build=@anthropic-ai/claude-code',
        'add',
        '-g',
        '@anthropic-ai/claude-code',
      ],
      {
        stdio: 'inherit',
        env: {
          PNPM_CONFIG_ENABLE_PRE_POST_SCRIPTS: 'true',
        },
      }
    )
    expect(execaMock).toHaveBeenCalledTimes(2)
  })
})
