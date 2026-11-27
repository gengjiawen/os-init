import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { execa } from 'execa'
import { installOpencodeDeps, writeOpencodeConfig } from './opencode'

describe('writeOpencodeConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>

  const expectedModelConfig = (name: string) => ({
    name,
    capabilities: {
      tools: true,
      input: ['text', 'image'],
      output: ['text'],
    },
  })

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-opencode-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes OpenCode config file', () => {
    const result = writeOpencodeConfig('test-api-key')

    expect(result.configPath).toBe(
      path.join(tempHome, '.config', 'opencode', 'opencode.json')
    )

    const config = JSON.parse(fs.readFileSync(result.configPath, 'utf8'))

    expect(config.$schema).toBe('https://opencode.ai/config.json')
    expect(config.providers.MyCustomProvider.package).toBe(
      '@opencode/ai/providers/openai-compatible'
    )
    expect(config.providers.MyCustomProvider.name).toBe('JWProvider')
    expect(config.providers.MyCustomProvider.settings.baseURL).toBe(
      'https://ai.gengjiawen.com/api/openai/v1'
    )
    expect(config.providers.MyCustomProvider.settings.apiKey).toBe(
      'test-api-key'
    )
    expect(config.providers.MyCustomProvider.models.code).toEqual({
      ...expectedModelConfig('code'),
      settings: {
        reasoningEffort: 'high',
      },
      cost: {
        input: 0.15,
        output: 0.6,
        cache: {
          read: 0.003,
        },
      },
    })
    expect(config.providers.MyCustomProvider.models.glm).toEqual(
      expectedModelConfig('glm')
    )
    expect(config.providers.MyCustomProvider.models.kimi).toEqual(
      expectedModelConfig('kimi')
    )
    expect(config.providers.MyCustomProvider.models.minimax).toEqual(
      expectedModelConfig('minimax')
    )
    expect(config.providers.MyCustomProvider.models.deepseek).toEqual(
      expectedModelConfig('deepseek')
    )
    expect(config.model).toBe('MyCustomProvider/code')
    expect(config.agents.title.model).toBe('MyCustomProvider/code')
    expect(config.provider).toBeUndefined()
    expect(config.small_model).toBeUndefined()
  })
})

describe('installOpencodeDeps', () => {
  const execaMock = jest.mocked(execa)
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>

  beforeEach(() => {
    jest.clearAllMocks()
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-opencode-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('installs @opencode/cli with pnpm when available', async () => {
    const pnpmGlobalRoot = path.join(tempHome, 'pnpm-global')

    execaMock
      .mockResolvedValueOnce({ failed: false, stdout: '10.33.2' } as never)
      .mockResolvedValueOnce({ stdout: pnpmGlobalRoot } as never)
      .mockResolvedValueOnce({} as never)

    await installOpencodeDeps()

    expect(execaMock).toHaveBeenNthCalledWith(
      3,
      'pnpm',
      ['--allow-build=@opencode/cli', 'add', '-g', '@opencode/cli'],
      {
        stdio: 'inherit',
        env: {
          PNPM_CONFIG_ENABLE_PRE_POST_SCRIPTS: 'true',
        },
      }
    )
  })

  test('falls back to npm when pnpm is unavailable', async () => {
    execaMock
      .mockRejectedValueOnce(new Error('pnpm not found'))
      .mockResolvedValueOnce({} as never)

    await installOpencodeDeps()

    expect(execaMock).toHaveBeenNthCalledWith(
      2,
      'npm',
      ['install', '-g', '@opencode/cli'],
      { stdio: 'inherit' }
    )
  })
})
