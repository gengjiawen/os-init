import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { Buffer } from 'node:buffer'
import { DatabaseSync } from 'node:sqlite'
import {
  CURSOR_TYPESCRIPT_EXTENSION_ID,
  disableCursorTypescriptExtension,
  getCursorStateDbPath,
  mergeDisabledExtension,
} from './cursor'

const DISABLED_EXTENSIONS_STORAGE_KEY = 'extensionsIdentifiers/disabled'

interface DisabledExtensionIdentifier {
  id: string
  uuid?: string
}

function readDisabledExtensions(dbPath: string): DisabledExtensionIdentifier[] {
  const db = new DatabaseSync(dbPath)

  try {
    const row = db
      .prepare('select value from ItemTable where key = ?')
      .get(DISABLED_EXTENSIONS_STORAGE_KEY) as
      | { value: string | Buffer }
      | undefined

    if (!row) {
      throw new Error('disabled extensions row was not written')
    }

    const value =
      typeof row.value === 'string'
        ? row.value
        : Buffer.from(row.value).toString('utf8')

    return JSON.parse(value) as DisabledExtensionIdentifier[]
  } finally {
    db.close()
  }
}

function writeDisabledExtensions(
  dbPath: string,
  disabledExtensions: DisabledExtensionIdentifier[]
): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })

  const db = new DatabaseSync(dbPath)

  try {
    db.exec(
      'create table if not exists ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)'
    )
    db.prepare('insert or replace into ItemTable(key,value) values (?, ?)').run(
      DISABLED_EXTENSIONS_STORAGE_KEY,
      JSON.stringify(disabledExtensions)
    )
  } finally {
    db.close()
  }
}

describe('getCursorStateDbPath', () => {
  test('returns macOS Cursor state DB path', () => {
    expect(getCursorStateDbPath('darwin', {}, '/Users/dev')).toBe(
      path.join(
        '/Users/dev',
        'Library',
        'Application Support',
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
    )
  })

  test('returns Linux Cursor state DB path', () => {
    expect(getCursorStateDbPath('linux', {}, '/home/dev')).toBe(
      path.join(
        '/home/dev',
        '.config',
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
    )
  })

  test('returns Windows Cursor state DB path', () => {
    expect(
      getCursorStateDbPath(
        'win32',
        { APPDATA: 'C:\\Users\\dev\\AppData\\Roaming' },
        'C:\\Users\\dev'
      )
    ).toBe(
      path.join(
        'C:\\Users\\dev\\AppData\\Roaming',
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb'
      )
    )
  })
})

describe('mergeDisabledExtension', () => {
  test('adds VS Code TypeScript extension to empty storage value', () => {
    const result = mergeDisabledExtension(undefined)

    expect(result.changed).toBe(true)
    expect(result.disabledExtensions).toEqual([
      { id: CURSOR_TYPESCRIPT_EXTENSION_ID },
    ])
    expect(JSON.parse(result.value)).toEqual([
      { id: CURSOR_TYPESCRIPT_EXTENSION_ID },
    ])
  })

  test('preserves existing disabled extensions', () => {
    const result = mergeDisabledExtension(
      JSON.stringify([{ id: 'publisher.extension', uuid: 'test-uuid' }])
    )

    expect(result.changed).toBe(true)
    expect(result.disabledExtensions).toEqual([
      { id: 'publisher.extension', uuid: 'test-uuid' },
      { id: CURSOR_TYPESCRIPT_EXTENSION_ID },
    ])
  })

  test('is idempotent and matches extension id case-insensitively', () => {
    const result = mergeDisabledExtension(
      JSON.stringify([{ id: CURSOR_TYPESCRIPT_EXTENSION_ID.toUpperCase() }])
    )

    expect(result.changed).toBe(false)
    expect(result.disabledExtensions).toEqual([
      { id: CURSOR_TYPESCRIPT_EXTENSION_ID.toUpperCase() },
    ])
  })

  test('rejects non-array storage value', () => {
    expect(() => mergeDisabledExtension(JSON.stringify({ id: 'bad' }))).toThrow(
      `${DISABLED_EXTENSIONS_STORAGE_KEY} must contain a JSON array`
    )
  })
})

describe('disableCursorTypescriptExtension', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-cursor-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('creates Cursor state DB and disables VS Code TypeScript extension', async () => {
    const dbPath = path.join(
      tempDir,
      'Cursor',
      'User',
      'globalStorage',
      'state.vscdb'
    )

    const result = await disableCursorTypescriptExtension({ dbPath })

    expect(result).toMatchObject({
      dbPath,
      key: DISABLED_EXTENSIONS_STORAGE_KEY,
      extensionId: CURSOR_TYPESCRIPT_EXTENSION_ID,
      changed: true,
    })
    expect(readDisabledExtensions(dbPath)).toEqual([
      { id: CURSOR_TYPESCRIPT_EXTENSION_ID },
    ])
  })

  test('preserves existing disabled extensions and is idempotent', async () => {
    const dbPath = path.join(tempDir, 'state.vscdb')

    writeDisabledExtensions(dbPath, [{ id: 'publisher.extension' }])

    const firstResult = await disableCursorTypescriptExtension({ dbPath })
    const secondResult = await disableCursorTypescriptExtension({ dbPath })

    expect(firstResult.changed).toBe(true)
    expect(secondResult.changed).toBe(false)
    expect(readDisabledExtensions(dbPath)).toEqual([
      { id: 'publisher.extension' },
      { id: CURSOR_TYPESCRIPT_EXTENSION_ID },
    ])
  })
})
