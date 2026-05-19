import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { Buffer } from 'node:buffer'
import { DatabaseSync } from 'node:sqlite'

export const CURSOR_TYPESCRIPT_EXTENSION_ID =
  'vscode.typescript-language-features'

const DISABLED_EXTENSIONS_STORAGE_KEY = 'extensionsIdentifiers/disabled'

interface DisabledExtensionIdentifier {
  id: string
  uuid?: string
}

export interface DisableCursorExtensionOptions {
  dbPath?: string
  extensionId?: string
}

export interface DisableCursorExtensionResult {
  dbPath: string
  key: string
  extensionId: string
  changed: boolean
  disabledExtensions: DisabledExtensionIdentifier[]
}

export function getCursorStateDbPath(
  platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  homeDir = os.homedir()
): string {
  switch (platform) {
    case 'darwin':
      return path.join(
        homeDir,
        'Library',
        'Application Support',
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
    case 'linux':
      return path.join(
        homeDir,
        '.config',
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
    case 'win32':
      return path.join(
        env.APPDATA || path.join(homeDir, 'AppData', 'Roaming'),
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
    default:
      return path.join(
        homeDir,
        '.config',
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
  }
}

function isDisabledExtensionIdentifier(
  value: unknown
): value is DisabledExtensionIdentifier {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string'
  )
}

export function mergeDisabledExtension(
  rawValue: string | null | undefined,
  extensionId = CURSOR_TYPESCRIPT_EXTENSION_ID
): {
  changed: boolean
  value: string
  disabledExtensions: DisabledExtensionIdentifier[]
} {
  const trimmedValue = rawValue?.trim()
  const parsedValue = trimmedValue ? JSON.parse(trimmedValue) : []

  if (!Array.isArray(parsedValue)) {
    throw new Error(
      `${DISABLED_EXTENSIONS_STORAGE_KEY} must contain a JSON array`
    )
  }

  const disabledExtensions = parsedValue.map((item) => {
    if (!isDisabledExtensionIdentifier(item)) {
      throw new Error(
        `${DISABLED_EXTENSIONS_STORAGE_KEY} contains an invalid extension identifier`
      )
    }
    return item
  })

  const hasExtension = disabledExtensions.some(
    (item) => item.id.toLowerCase() === extensionId.toLowerCase()
  )

  if (hasExtension) {
    return {
      changed: false,
      value: JSON.stringify(disabledExtensions),
      disabledExtensions,
    }
  }

  const nextDisabledExtensions = [
    ...disabledExtensions,
    {
      id: extensionId,
    },
  ]

  return {
    changed: true,
    value: JSON.stringify(nextDisabledExtensions),
    disabledExtensions: nextDisabledExtensions,
  }
}

function storageValueToString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('utf8')
  }

  throw new Error(`${DISABLED_EXTENSIONS_STORAGE_KEY} must be stored as text`)
}

export async function disableCursorTypescriptExtension(
  options: DisableCursorExtensionOptions = {}
): Promise<DisableCursorExtensionResult> {
  const dbPath = options.dbPath || getCursorStateDbPath()
  const extensionId = options.extensionId || CURSOR_TYPESCRIPT_EXTENSION_ID

  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  if (fs.existsSync(dbPath)) {
    const stat = fs.statSync(dbPath)
    if (!stat.isFile()) {
      throw new Error(`Cursor state DB path is not a file: ${dbPath}`)
    }
  }

  const db = new DatabaseSync(dbPath)

  try {
    db.exec(
      'create table if not exists ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)'
    )

    const row = db
      .prepare('select value from ItemTable where key = ?')
      .get(DISABLED_EXTENSIONS_STORAGE_KEY) as { value: unknown } | undefined

    const merged = mergeDisabledExtension(
      storageValueToString(row?.value),
      extensionId
    )

    if (merged.changed) {
      db.prepare(
        'insert or replace into ItemTable(key,value) values (?, ?)'
      ).run(DISABLED_EXTENSIONS_STORAGE_KEY, merged.value)
    }

    return {
      dbPath,
      key: DISABLED_EXTENSIONS_STORAGE_KEY,
      extensionId,
      changed: merged.changed,
      disabledExtensions: merged.disabledExtensions,
    }
  } finally {
    db.close()
  }
}
