import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const MARKER_START = '# ===== os-init setup-env - START ====='
const MARKER_END = '# ===== os-init setup-env - END ====='
const BASH_PROFILE_MARKER_START =
  '# ===== os-init setup-env bash_profile - START ====='
const BASH_PROFILE_MARKER_END =
  '# ===== os-init setup-env bash_profile - END ====='

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
    `${home}/.jsvu/bin`,
    `${home}/.local/bin`,
    `${home}/.yarn/bin`,
  ]

  if (process.platform === 'darwin') {
    pathEntries.push(`${rustupHome}/toolchains/stable-aarch64-apple-darwin/bin`)
  }

  return `${MARKER_START}
export PNPM_HOME="${pnpmHome}"
export RUSTUP_HOME="${rustupHome}"
export CARGO_HOME="${cargoHome}"
export PATH="${pathEntries.join(':')}:$PATH"
${MARKER_END}
`
}

function generateBashProfileContent(): string {
  return `${BASH_PROFILE_MARKER_START}
if [ -f "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi
${BASH_PROFILE_MARKER_END}
`
}

function stripLeadingNewline(content: string): string {
  if (content.startsWith('\r\n')) {
    return content.slice(2)
  }
  if (content.startsWith('\n')) {
    return content.slice(1)
  }
  return content
}

function bashProfileSourcesBashrc(content: string): boolean {
  return content
    .split(/\r?\n/)
    .some((line) =>
      /^\s*(?:source|\.)\s+(?:"\$HOME\/\.bashrc"|'\$HOME\/\.bashrc'|\$HOME\/\.bashrc|~\/\.bashrc)(?:\s|$)/.test(
        line
      )
    )
}

function ensureMacBashProfileSourcesBashrc(home: string): {
  bashProfilePath: string
  changed: boolean
} {
  const bashProfilePath = path.join(home, '.bash_profile')
  let currentContent = ''

  if (fs.existsSync(bashProfilePath)) {
    currentContent = fs.readFileSync(bashProfilePath, 'utf-8')
  }

  if (
    currentContent.includes(BASH_PROFILE_MARKER_START) ||
    bashProfileSourcesBashrc(currentContent)
  ) {
    return { bashProfilePath, changed: false }
  }

  const newBlock =
    (currentContent && !currentContent.endsWith('\n') ? '\n' : '') +
    generateBashProfileContent()
  fs.appendFileSync(bashProfilePath, newBlock)

  return { bashProfilePath, changed: true }
}

export function setupEnv(): {
  bashrcPath: string
  bashProfilePath?: string
  changed: boolean
} {
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
      const after = stripLeadingNewline(
        currentContent.slice(endIdx + MARKER_END.length)
      )
      const newBlock = generateBashrcContent()
      const nextContent = before + newBlock + after
      const bashrcChanged = nextContent !== currentContent
      if (bashrcChanged) {
        fs.writeFileSync(bashrcPath, nextContent)
      }

      if (process.platform === 'darwin') {
        const profileResult = ensureMacBashProfileSourcesBashrc(home)
        return {
          bashrcPath,
          bashProfilePath: profileResult.bashProfilePath,
          changed: bashrcChanged || profileResult.changed,
        }
      }
      return { bashrcPath, changed: bashrcChanged }
    }
  }

  // Append new block
  const newBlock =
    (currentContent && !currentContent.endsWith('\n') ? '\n' : '') +
    generateBashrcContent()
  fs.appendFileSync(bashrcPath, newBlock)

  if (process.platform === 'darwin') {
    const profileResult = ensureMacBashProfileSourcesBashrc(home)
    return {
      bashrcPath,
      bashProfilePath: profileResult.bashProfilePath,
      changed: true,
    }
  }

  return { bashrcPath, changed: true }
}
