import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

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
    const configContent = fs.readFileSync(result.configPath, 'utf8')

    expect(configContent).toContain('model_auto_compact_token_limit = 131072')
  })
})
