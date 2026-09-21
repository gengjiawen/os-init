import { execa } from 'execa'

/**
 * Tinycast keeps AI connections in `UserDefaults` and the key in the login
 * Keychain, and excludes both from its settings import on purpose, so there is
 * no config file to write the way Raycast has one. These are the two stores it
 * reads at launch; see the app's `AppSettingsKey` and `KeychainSecretStore`.
 */
const TINYCAST_BUNDLE_ID = 'com.tinycast.app'
const TINYCAST_KEYCHAIN_SERVICE = `${TINYCAST_BUNDLE_ID}.ai-api-keys`
const TINYCAST_BASE_URL = 'https://ai.gengjiawen.com/api/openai/v1'
const TINYCAST_DEFAULT_MODEL = 'sota'
const TINYCAST_MODEL_IDS = [
  TINYCAST_DEFAULT_MODEL,
  'gpt',
  'glm',
  'kimi',
  'minimax',
  'deepseek',
]

/**
 * Fixed rather than random: the key is stored under the connection id, so a
 * stable id lets a re-run update this connection instead of appending a
 * duplicate and orphaning the previous Keychain item. Uppercase because that is
 * what Swift's `UUID` encodes to.
 */
const TINYCAST_CONNECTION_ID = '7E3A1C04-9B52-5F86-A1D7-0C4E8B2F6A93'

export interface TinycastConnection {
  id: string
  name: string
  provider: string
  baseURL: string
  models: string[]
  visionModels: string[]
}

/** Build the `AIConnection` Tinycast decodes from the `aiConnections` default */
export function buildTinycastConnection(): TinycastConnection {
  return {
    id: TINYCAST_CONNECTION_ID,
    name: 'gengjiawen AI',
    // The only preset with a user-editable base URL, which is what a gateway needs.
    provider: 'openAICompatible',
    baseURL: TINYCAST_BASE_URL,
    models: TINYCAST_MODEL_IDS,
    visionModels: [],
  }
}

/** Build the `AIModelSelection` Tinycast decodes from the `aiDefaultModel` default */
export function buildTinycastDefaultModel(): unknown {
  return {
    api: { connection: TINYCAST_CONNECTION_ID, model: TINYCAST_DEFAULT_MODEL },
  }
}

/** Replace our connection in place, leaving every other one the user has */
export function mergeTinycastConnections(
  existing: TinycastConnection[],
  connection: TinycastConnection
): TinycastConnection[] {
  const index = existing.findIndex((entry) => entry.id === connection.id)
  if (index === -1) {
    return [...existing, connection]
  }
  const merged = [...existing]
  merged[index] = connection
  return merged
}

/** `defaults write -data` takes hex, and these defaults hold JSON-encoded data */
export function encodeDefaultsData(value: unknown): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('hex')
}

function decodeConnections(base64: unknown): TinycastConnection[] {
  if (typeof base64 !== 'string') {
    return []
  }
  try {
    const parsed = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // A default we cannot read is one Tinycast wrote in a shape we do not know.
    return []
  }
}

/** Read the app's current defaults through `cfprefsd`, not the plist file */
async function readTinycastDefaults(): Promise<Record<string, unknown>> {
  const exported = await execa(
    'defaults',
    ['export', TINYCAST_BUNDLE_ID, '-'],
    {
      reject: false,
    }
  )
  if (exported.exitCode !== 0 || exported.stdout.trim().length === 0) {
    return {}
  }
  const converted = await execa(
    'plutil',
    ['-convert', 'json', '-o', '-', '-'],
    {
      input: exported.stdout,
      reject: false,
    }
  )
  if (converted.exitCode !== 0) {
    return {}
  }
  try {
    return JSON.parse(converted.stdout)
  } catch {
    return {}
  }
}

async function assertTinycastNotRunning(): Promise<void> {
  const running = await execa('pgrep', ['-x', 'Tinycast'], { reject: false })
  if (running.exitCode === 0) {
    throw new Error(
      'Tinycast is running. Quit it first — a running app rewrites its own preferences and would discard this config.'
    )
  }
}

/**
 * Point Tinycast's AI Chat at the gateway.
 *
 * Writes the connection and the default model to `com.tinycast.app`'s defaults,
 * enables AI Chat (off out of the box), and stores the key in the login Keychain
 * under the connection id. macOS only.
 */
export async function writeTinycastConfig(
  apiKey: string
): Promise<{ connectionId: string; baseURL: string }> {
  if (process.platform !== 'darwin') {
    throw new Error('Tinycast is macOS only.')
  }

  await assertTinycastNotRunning()

  const connection = buildTinycastConnection()
  const defaults = await readTinycastDefaults()
  const connections = mergeTinycastConnections(
    decodeConnections(defaults.aiConnections),
    connection
  )

  await execa('defaults', [
    'write',
    TINYCAST_BUNDLE_ID,
    'aiConnections',
    '-data',
    encodeDefaultsData(connections),
  ])
  await execa('defaults', [
    'write',
    TINYCAST_BUNDLE_ID,
    'aiDefaultModel',
    '-data',
    encodeDefaultsData(buildTinycastDefaultModel()),
  ])
  await execa('defaults', [
    'write',
    TINYCAST_BUNDLE_ID,
    'aiEnabled',
    '-bool',
    'true',
  ])

  // `-U` updates the item when a previous run already stored a key for this id.
  await execa('security', [
    'add-generic-password',
    '-U',
    '-s',
    TINYCAST_KEYCHAIN_SERVICE,
    '-a',
    connection.id,
    '-w',
    apiKey,
  ])

  return { connectionId: connection.id, baseURL: connection.baseURL }
}
