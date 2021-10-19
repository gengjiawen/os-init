import { spawn } from 'child_process'
import { packages } from './packages'

export function init() {
  const cmd = `@"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "[System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin"`
  const s = spawn(cmd, {
    shell: true,
  })
  s.stdout.pipe(process.stdout)
  s.stderr.pipe(process.stdout)
}

export function list() {
  console.log(packages.join('\n'))
}
