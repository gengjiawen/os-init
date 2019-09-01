import { spawn } from 'child_process'

export function init() {
  const cmd = `@"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -NoProfile -InputFormat None -ExecutionPolicy Bypass -Command "iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))" && SET "PATH=%PATH%;%ALLUSERSPROFILE%\\chocolatey\\bin"`
  const s = spawn(cmd, {
    shell: true
  })
  s.stdout.pipe(process.stdout)
  s.stderr.pipe(process.stdout)
}
