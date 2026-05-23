import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as yaml from 'yaml'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { execa } from 'execa'
import { installAllAgentsDeps, writeAllAgentsConfig } from './all-agents'

describe('writeAllAgentsConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>
  let originalAppData: string | undefined
  const execaMock = jest.mocked(execa)

  beforeEach(() => {
    jest.clearAllMocks()
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

  test('writes Claude and Codex config by default', () => {
    const result = writeAllAgentsConfig('test-api-key')

    expect(fs.existsSync(result.claude.settingsPath)).toBe(true)
    expect(fs.existsSync(result.codex.configPath)).toBe(true)
    expect(fs.existsSync(result.codex.authPath)).toBe(true)
    expect(result.opencode).toBeUndefined()
  })

  test('includes OpenCode config when full option is enabled', () => {
    const result = writeAllAgentsConfig('test-api-key', { full: true })

    expect(result.opencode).toBeDefined()
    expect(fs.existsSync(result.opencode!.configPath)).toBe(true)
  })

  test('installs Claude and Codex in one pnpm command', async () => {
    const pnpmGlobalRoot = path.join(tempHome, 'pnpm-global')
    const workspacePath = path.join(pnpmGlobalRoot, 'pnpm-workspace.yaml')

    execaMock
      .mockResolvedValueOnce({ failed: false, stdout: '10.33.2' } as never)
      .mockResolvedValueOnce({ stdout: pnpmGlobalRoot } as never)
      .mockResolvedValueOnce({} as never)

    await installAllAgentsDeps()

    expect(execaMock).toHaveBeenNthCalledWith(1, 'pnpm', ['--version'], {
      stdio: 'pipe',
      reject: false,
    })
    expect(execaMock).toHaveBeenNthCalledWith(2, 'pnpm', ['root', '-g'])
    expect(execaMock).toHaveBeenNthCalledWith(
      3,
      'pnpm',
      [
        '--allow-build=@anthropic-ai/claude-code',
        'add',
        '-g',
        '@anthropic-ai/claude-code',
        '@openai/codex',
      ],
      {
        stdio: 'inherit',
        env: {
          PNPM_CONFIG_ENABLE_PRE_POST_SCRIPTS: 'true',
        },
      }
    )
    expect(execaMock).toHaveBeenCalledTimes(3)

    const workspace = yaml.parse(fs.readFileSync(workspacePath, 'utf8'))
    expect(workspace.allowBuilds['@anthropic-ai/claude-code']).toBe(true)
  })

  test('installs all requested agents in one npm command when pnpm is unavailable', async () => {
    execaMock
      .mockRejectedValueOnce(new Error('pnpm not found'))
      .mockResolvedValueOnce({} as never)

    await installAllAgentsDeps({ full: true })

    expect(execaMock).toHaveBeenNthCalledWith(1, 'pnpm', ['--version'], {
      stdio: 'pipe',
      reject: false,
    })
    expect(execaMock).toHaveBeenNthCalledWith(
      2,
      'npm',
      [
        'install',
        '-g',
        '@anthropic-ai/claude-code',
        '@openai/codex',
        'opencode-ai',
      ],
      { stdio: 'inherit' }
    )
    expect(execaMock).toHaveBeenCalledTimes(2)
  })
})
