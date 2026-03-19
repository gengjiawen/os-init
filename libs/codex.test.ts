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
  let originalFetch: typeof global.fetch | undefined

  function mockCatalogFetch(
    catalog: { models: Array<Record<string, unknown>> } = {
      models: [{ id: 'gpt-5.4' }],
    }
  ): jest.Mock {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => catalog,
    })
    global.fetch = fetchMock as unknown as typeof global.fetch
    return fetchMock
  }

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-codex-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
    originalFetch = global.fetch
    mockCatalogFetch()
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    if (originalFetch === undefined) {
      global.fetch = undefined as unknown as typeof global.fetch
    } else {
      global.fetch = originalFetch
    }
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes config with 128k auto compact threshold', async () => {
    const result = await writeCodexConfig('test-api-key')
    const config = TOML.parse(fs.readFileSync(result.configPath, 'utf8')) as {
      model_auto_compact_token_limit: number
      model_catalog_json: string
    }

    expect(config.model_auto_compact_token_limit).toBe(131072)
    expect(config.model_catalog_json).toBe('~/.codex/remote-model-catalog.json')
    expect(fs.existsSync(result.catalogPath)).toBe(true)
  })

  test('merges template keys and keeps custom config', async () => {
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

    await writeCodexConfig('test-api-key')
    const config = TOML.parse(fs.readFileSync(configPath, 'utf8')) as {
      service_tier: string
      custom_flag: boolean
      model: string
      model_catalog_json: string
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
    expect(config.model_catalog_json).toBe('~/.codex/remote-model-catalog.json')
    expect(config.preferred_auth_method).toBe('apikey')
    expect(config.model_providers.jw.base_url).toBe(
      'https://ai.gengjiawen.com/api/openai'
    )
    expect(config.model_providers.jw.custom_model).toBe('keep-me')
    expect(config.model_providers.jw.name).toBe('jw')
  })

  test('adds missing keys without removing custom config', async () => {
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

    await writeCodexConfig('test-api-key')
    const config = TOML.parse(fs.readFileSync(configPath, 'utf8')) as {
      model: string
      model_catalog_json: string
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
    expect(config.model_catalog_json).toBe('~/.codex/remote-model-catalog.json')
    expect(config.preferred_auth_method).toBe('apikey')
    expect(config.model_providers.jw.name).toBe('jw')
    expect(config.service_tier).toBe('fast')
  })

  test('refreshes remote model catalog after writing config', async () => {
    const fetchMock = mockCatalogFetch({
      models: [
        { id: 'gpt-5.4' },
        { id: 'gpt-5.4-mini' },
        { id: 'gpt-5.3-codex' },
      ],
    })

    const result = await writeCodexConfig('test-api-key')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://ai.gengjiawen.com/api/openai/models',
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer test-api-key',
          'User-Agent': '@gengjiawen/os-init',
        },
      }
    )

    const catalog = JSON.parse(fs.readFileSync(result.catalogPath, 'utf8')) as {
      models: Array<{ id: string }>
    }

    expect(catalog).toEqual({
      models: [
        { id: 'gpt-5.4' },
        { id: 'gpt-5.4-mini' },
        { id: 'gpt-5.3-codex' },
      ],
    })
  })

  test('throws when refreshing the remote model catalog fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    }) as unknown as typeof global.fetch

    await expect(writeCodexConfig('test-api-key')).rejects.toThrow(
      'Failed to refresh Codex model catalog: 503 Service Unavailable'
    )

    expect(fs.existsSync(path.join(tempHome, '.codex', 'config.toml'))).toBe(
      false
    )
    expect(fs.existsSync(path.join(tempHome, '.codex', 'auth.json'))).toBe(
      false
    )
    expect(
      fs.existsSync(path.join(tempHome, '.codex', 'remote-model-catalog.json'))
    ).toBe(false)
  })
})
