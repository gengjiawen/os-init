import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as TOML from '@iarna/toml'

jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { writeCodexConfig } from './codex'

describe('writeCodexConfig', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-codex-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes config with 128k auto compact threshold', () => {
    const result = writeCodexConfig('test-api-key')
    const config = TOML.parse(fs.readFileSync(result.configPath, 'utf8')) as {
      model_auto_compact_token_limit: number
    }

    expect(config.model_auto_compact_token_limit).toBe(131072)
  })

  test('merges template keys and keeps custom config', () => {
    const configDir = path.join(tempHome, '.codex')
    fs.mkdirSync(configDir, { recursive: true })
    const configPath = path.join(configDir, 'config.toml')

    fs.writeFileSync(
      configPath,
      `service_tier = "slow"
custom_flag = true

[model_providers.jw]
base_url = "https://example.com" # keep comment
custom_model = "keep-me"
`
    )

    writeCodexConfig('test-api-key')
    const config = TOML.parse(fs.readFileSync(configPath, 'utf8')) as {
      service_tier: string
      custom_flag: boolean
      model: string
      preferred_auth_method: string
      model_providers: {
        jw: {
          base_url: string
          custom_model: string
          name: string
        }
      }
    }

    expect(config.service_tier).toBe('fast')
    expect(config.custom_flag).toBe(true)
    expect(config.model).toBe('gpt-5.4')
    expect(config.preferred_auth_method).toBe('apikey')
    expect(config.model_providers.jw.base_url).toBe(
      'https://ai.gengjiawen.com/api/openai'
    )
    expect(config.model_providers.jw.custom_model).toBe('keep-me')
    expect(config.model_providers.jw.name).toBe('jw')
  })

  test('adds missing keys without removing custom config', () => {
    const configDir = path.join(tempHome, '.codex')
    fs.mkdirSync(configDir, { recursive: true })
    const configPath = path.join(configDir, 'config.toml')

    fs.writeFileSync(
      configPath,
      `service_tier = "slow"

[model_providers.jw]
base_url = "https://example.com"
`
    )

    writeCodexConfig('test-api-key')
    const config = TOML.parse(fs.readFileSync(configPath, 'utf8')) as {
      model: string
      preferred_auth_method: string
      service_tier: string
      model_providers: {
        jw: {
          name: string
          base_url: string
        }
      }
    }

    expect(config.model).toBe('gpt-5.4')
    expect(config.preferred_auth_method).toBe('apikey')
    expect(config.model_providers.jw.name).toBe('jw')
    expect(config.service_tier).toBe('fast')
  })
})
