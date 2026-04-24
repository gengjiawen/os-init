import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { writeOpencodeConfig } from './opencode'

describe('writeOpencodeConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>

  const expectedModelConfig = (name: string) => ({
    name,
    attachment: true,
    modalities: {
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
    expect(config.provider.MyCustomProvider.npm).toBe(
      '@ai-sdk/openai-compatible'
    )
    expect(config.provider.MyCustomProvider.name).toBe('JWProvider')
    expect(config.provider.MyCustomProvider.options.baseURL).toBe(
      'https://ai.gengjiawen.com/api/openai/v1'
    )
    expect(config.provider.MyCustomProvider.options.apiKey).toBe('test-api-key')
    expect(config.provider.MyCustomProvider.models.code).toEqual(
      expectedModelConfig('code')
    )
    expect(config.provider.MyCustomProvider.models.glm).toEqual(
      expectedModelConfig('glm')
    )
    expect(config.provider.MyCustomProvider.models.kimi).toEqual(
      expectedModelConfig('kimi')
    )
    expect(config.provider.MyCustomProvider.models.minimax).toEqual(
      expectedModelConfig('minimax')
    )
    expect(config.provider.MyCustomProvider.models.deepseek).toEqual(
      expectedModelConfig('deepseek')
    )
    expect(config.model).toBe('MyCustomProvider/code')
    expect(config.small_model).toBe('MyCustomProvider/code')
  })
})
