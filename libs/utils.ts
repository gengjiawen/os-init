import * as fs from 'fs'
import * as path from 'path'
import { execa } from 'execa'
import * as yaml from 'yaml'

export const PNPM_INSTALL_ENV = {
  PNPM_CONFIG_ENABLE_PRE_POST_SCRIPTS: 'true',
}

/** Ensure directory exists */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

export async function getCommandVersion(
  command: string
): Promise<string | null> {
  try {
    const { failed, stdout } = await execa(command, ['--version'], {
      stdio: 'pipe',
      reject: false,
    })
    return failed ? null : stdout.trim()
  } catch (error) {
    return null
  }
}

export function pnpmSupportsAllowBuild(version: string): boolean {
  const major = Number.parseInt(version, 10)
  return Number.isInteger(major) && major >= 10
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Persistently allow a package's pnpm install/build script in the global workspace. */
export async function allowPnpmGlobalBuild(packageName: string): Promise<void> {
  const { stdout } = await execa('pnpm', ['root', '-g'])
  const globalRoot = stdout.trim()

  if (globalRoot.length === 0) {
    throw new Error('Unable to locate pnpm global root.')
  }

  ensureDir(globalRoot)

  const workspacePath = path.join(globalRoot, 'pnpm-workspace.yaml')
  const source = fs.existsSync(workspacePath)
    ? fs.readFileSync(workspacePath, 'utf8')
    : ''
  const parsed = source.trim().length > 0 ? yaml.parse(source) : {}
  const workspace = isRecord(parsed) ? parsed : {}
  const existingAllowBuilds = workspace.allowBuilds
  const allowBuilds = isRecord(existingAllowBuilds)
    ? { ...existingAllowBuilds }
    : {}

  allowBuilds[packageName] = true
  workspace.allowBuilds = allowBuilds

  fs.writeFileSync(workspacePath, yaml.stringify(workspace))
}

/** Check if a command exists */
export async function commandExists(command: string): Promise<boolean> {
  return (await getCommandVersion(command)) !== null
}
