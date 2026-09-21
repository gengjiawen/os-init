jest.mock('execa', () => ({
  execa: jest.fn(),
}))

import { execa } from 'execa'
import {
  buildTinycastConnection,
  buildTinycastDefaultModel,
  encodeDefaultsData,
  mergeTinycastConnections,
  writeTinycastConfig,
} from './tinycast'

const execaMock = execa as unknown as jest.Mock

const BUNDLE_ID = 'com.tinycast.app'

function decodeHex(hex: string) {
  return JSON.parse(Buffer.from(hex, 'hex').toString('utf8'))
}

function callFor(command: string, ...args: string[]) {
  return execaMock.mock.calls.find(
    ([binary, argv]: [string, string[]]) =>
      binary === command && args.every((arg, index) => argv[index] === arg)
  )
}

describe('tinycast config builders', () => {
  test('builds an OpenAI-compatible connection for the gateway', () => {
    const connection = buildTinycastConnection()

    expect(connection.provider).toBe('openAICompatible')
    expect(connection.baseURL).toBe('https://ai.gengjiawen.com/api/openai/v1')
    expect(connection.models).toContain('sota')
    expect(connection.visionModels).toEqual([])
    // Swift's UUID encodes uppercase, and Tinycast keys the Keychain item on it.
    expect(connection.id).toBe(connection.id.toUpperCase())
  })

  test('selects sota on the connection it just built', () => {
    expect(buildTinycastDefaultModel()).toEqual({
      api: { connection: buildTinycastConnection().id, model: 'sota' },
    })
  })

  test('replaces our connection and keeps the rest', () => {
    const connection = buildTinycastConnection()
    const mine = { ...connection, models: ['stale'] }
    const theirs = { ...connection, id: 'OTHER', name: 'theirs' }

    const merged = mergeTinycastConnections([theirs, mine], connection)

    expect(merged).toHaveLength(2)
    expect(merged[0]).toBe(theirs)
    expect(merged[1].models).toEqual(connection.models)
  })

  test('appends when no connection of ours is stored yet', () => {
    const connection = buildTinycastConnection()
    const theirs = { ...connection, id: 'OTHER', name: 'theirs' }

    expect(mergeTinycastConnections([theirs], connection)).toEqual([
      theirs,
      connection,
    ])
  })

  test('encodes defaults data as the hex `defaults write -data` takes', () => {
    expect(decodeHex(encodeDefaultsData({ a: 1 }))).toEqual({ a: 1 })
  })
})

describe('writeTinycastConfig', () => {
  const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform')

  function setPlatform(platform: string) {
    Object.defineProperty(process, 'platform', { value: platform })
  }

  beforeEach(() => {
    execaMock.mockReset()
    setPlatform('darwin')
  })

  afterEach(() => {
    if (originalPlatform) {
      Object.defineProperty(process, 'platform', originalPlatform)
    }
  })

  function mockExeca(existingConnections?: unknown) {
    execaMock.mockImplementation(async (command: string, args: string[]) => {
      if (command === 'pgrep') {
        return { exitCode: 1, stdout: '' }
      }
      if (command === 'defaults' && args[0] === 'export') {
        return existingConnections === undefined
          ? { exitCode: 1, stdout: '' }
          : { exitCode: 0, stdout: '<plist/>' }
      }
      if (command === 'plutil') {
        return {
          exitCode: 0,
          stdout: JSON.stringify({
            aiConnections: Buffer.from(
              JSON.stringify(existingConnections)
            ).toString('base64'),
          }),
        }
      }
      return { exitCode: 0, stdout: '' }
    })
  }

  test('writes the connection, the selection, the switch and the key', async () => {
    mockExeca()

    const result = await writeTinycastConfig('test-api-key')

    const connection = buildTinycastConnection()
    expect(result).toEqual({
      connectionId: connection.id,
      baseURL: connection.baseURL,
    })

    const connectionsCall = callFor(
      'defaults',
      'write',
      BUNDLE_ID,
      'aiConnections'
    )
    expect(decodeHex(connectionsCall![1][4])).toEqual([connection])

    const modelCall = callFor('defaults', 'write', BUNDLE_ID, 'aiDefaultModel')
    expect(decodeHex(modelCall![1][4])).toEqual(buildTinycastDefaultModel())

    // AI Chat is off out of the box, so configuring it has to arm it too.
    expect(callFor('defaults', 'write', BUNDLE_ID, 'aiEnabled')).toBeDefined()

    const keychainCall = callFor('security', 'add-generic-password')
    expect(keychainCall![1]).toEqual([
      'add-generic-password',
      '-U',
      '-s',
      'com.tinycast.app.ai-api-keys',
      '-a',
      connection.id,
      '-w',
      'test-api-key',
    ])
  })

  test('keeps connections the user configured themselves', async () => {
    const theirs = { ...buildTinycastConnection(), id: 'OTHER', name: 'theirs' }
    mockExeca([theirs])

    await writeTinycastConfig('test-api-key')

    const connectionsCall = callFor(
      'defaults',
      'write',
      BUNDLE_ID,
      'aiConnections'
    )
    expect(decodeHex(connectionsCall![1][4])).toEqual([
      theirs,
      buildTinycastConnection(),
    ])
  })

  test('refuses while Tinycast is running, before writing anything', async () => {
    execaMock.mockImplementation(async (command: string) => {
      if (command === 'pgrep') {
        return { exitCode: 0, stdout: '4242' }
      }
      return { exitCode: 0, stdout: '' }
    })

    await expect(writeTinycastConfig('test-api-key')).rejects.toThrow(
      /Quit it first/
    )
    expect(callFor('defaults', 'write')).toBeUndefined()
    expect(callFor('security')).toBeUndefined()
  })

  test('refuses off macOS', async () => {
    setPlatform('linux')
    mockExeca()

    await expect(writeTinycastConfig('test-api-key')).rejects.toThrow(
      'Tinycast is macOS only.'
    )
    expect(execaMock).not.toHaveBeenCalled()
  })
})
