import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const MARKER_START = '# ===== os-init setup-env - START ====='
const MARKER_END = '# ===== os-init setup-env - END ====='

function getBrewPrefix(): string {
  if (process.platform === 'darwin') {
    if (fs.existsSync('/opt/homebrew/bin/brew')) {
      return '/opt/homebrew'
    }
    return '/usr/local'
  }
  return '/home/linuxbrew/.linuxbrew'
}

function getPnpmHome(): string {
  const home = os.homedir()
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'pnpm')
  }
  return path.join(home, '.pnpm')
}

function generateBashrcContent(): string {
  const brewPrefix = getBrewPrefix()
  const home = os.homedir()
  const pnpmHome = getPnpmHome()
  const cargoHome = path.join(home, '.cargo')
  const rustupHome = path.join(home, '.rustup')

  const pathEntries = [
    `${brewPrefix}/bin`,
    `${brewPrefix}/sbin`,
    pnpmHome,
    `${cargoHome}/bin`,
    `${rustupHome}/toolchains/stable-aarch64-apple-darwin/bin`,
    `${home}/.jsvu/bin`,
    `${home}/.local/bin`,
    `${home}/.yarn/bin`,
  ]

  return `${MARKER_START}
export PNPM_HOME="${pnpmHome}"
export RUSTUP_HOME="${rustupHome}"
export CARGO_HOME="${cargoHome}"
export PATH="${pathEntries.join(':')}:$PATH"
${MARKER_END}
`
}

export function setupEnv(): { bashrcPath: string; changed: boolean } {
  const home = os.homedir()
  const bashrcPath = path.join(home, '.bashrc')

  let currentContent = ''
  if (fs.existsSync(bashrcPath)) {
    currentContent = fs.readFileSync(bashrcPath, 'utf-8')
  }

  if (currentContent.includes(MARKER_START)) {
    // Replace existing block
    const startIdx = currentContent.indexOf(MARKER_START)
    const endIdx = currentContent.indexOf(MARKER_END, startIdx)
    if (endIdx !== -1) {
      const before = currentContent.slice(0, startIdx)
      const after = currentContent.slice(endIdx + MARKER_END.length)
      const newBlock = generateBashrcContent()
      fs.writeFileSync(bashrcPath, before + newBlock + after)
      return { bashrcPath, changed: true }
    }
  }

  // Append new block
  const newBlock =
    (currentContent && !currentContent.endsWith('\n') ? '\n' : '') +
    generateBashrcContent()
  fs.appendFileSync(bashrcPath, newBlock)
  return { bashrcPath, changed: true }
}
