import { packages } from './packages'
import * as execa from 'execa'

export const psPolicy = `Set-ExecutionPolicy -ExecutionPolicy ByPass`

export async function init() {
  const cmd = `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`
  console.log(`need to ${psPolicy} if you are not`)
  console.log(cmd)
  await execa.command(cmd, { shell: 'powershell', stdio: 'inherit' })
}

export function list() {
  console.log(packages.join('\n'))
}
