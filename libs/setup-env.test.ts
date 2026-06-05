import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { setupEnv } from './setup-env'

describe('setupEnv', () => {
  let tempHome: string
  let homedirSpy: jest.SpiedFunction<typeof os.homedir>
  let platformDescriptor: PropertyDescriptor | undefined

  function mockPlatform(platform: NodeJS.Platform): void {
    Object.defineProperty(process, 'platform', {
      value: platform,
    })
  }

  beforeEach(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'os-init-env-'))
    homedirSpy = jest.spyOn(os, 'homedir').mockReturnValue(tempHome)
    platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform')
  })

  afterEach(() => {
    homedirSpy.mockRestore()
    if (platformDescriptor) {
      Object.defineProperty(process, 'platform', platformDescriptor)
    }
    fs.rmSync(tempHome, { recursive: true, force: true })
  })

  test('writes environment block to bashrc on Linux', () => {
    mockPlatform('linux')

    const result = setupEnv()
    const bashrcPath = path.join(tempHome, '.bashrc')

    expect(result).toEqual({
      bashrcPath,
      changed: true,
    })
    expect(fs.readFileSync(bashrcPath, 'utf-8')).toContain('export PNPM_HOME=')
    expect(fs.existsSync(path.join(tempHome, '.bash_profile'))).toBe(false)
  })

  test('creates macOS bash profile that sources bashrc', () => {
    mockPlatform('darwin')

    const result = setupEnv()
    const bashProfilePath = path.join(tempHome, '.bash_profile')

    expect(result).toEqual({
      bashrcPath: path.join(tempHome, '.bashrc'),
      bashProfilePath,
      changed: true,
    })
    expect(fs.readFileSync(bashProfilePath, 'utf-8')).toContain(
      '. "$HOME/.bashrc"'
    )
  })

  test('does not duplicate an existing macOS bashrc source line', () => {
    mockPlatform('darwin')
    const bashProfilePath = path.join(tempHome, '.bash_profile')
    const bashProfileContent = 'source ~/.bashrc\n'
    fs.writeFileSync(bashProfilePath, bashProfileContent)

    const result = setupEnv()

    expect(result.bashProfilePath).toBe(bashProfilePath)
    expect(fs.readFileSync(bashProfilePath, 'utf-8')).toBe(bashProfileContent)
  })

  test('second macOS run reports unchanged files', () => {
    mockPlatform('darwin')

    setupEnv()
    const result = setupEnv()

    expect(result).toEqual({
      bashrcPath: path.join(tempHome, '.bashrc'),
      bashProfilePath: path.join(tempHome, '.bash_profile'),
      changed: false,
    })
  })
})
