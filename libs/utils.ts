import * as fs from 'fs'
import { execa } from 'execa'

/** Ensure directory exists */
export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

/** Check if a command exists */
export async function commandExists(command: string): Promise<boolean> {
  try {
    // execa with reject: false will not throw on non-zero exit codes.
    const { failed } = await execa(command, ['--version'], {
      stdio: 'ignore',
      reject: false,
    })
    return !failed
  } catch (error) {
    // Catch errors for commands that don't support --version or other issues
    return false
  }
}
