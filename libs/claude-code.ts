import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import { ParseError, applyEdits, modify, parse } from 'jsonc-parser'
import { ensureDir, commandExists, PNPM_INSTALL_ENV } from './utils'

const CLAUDE_BASE_URL = 'https://ai.gengjiawen.com/api/claude/'

/** Return Claude settings directory path */
function getClaudeSettingsDir(): string {
  return path.join(os.homedir(), '.claude')
}

/** Return VSCode user settings.json path */
function getVSCodeUserSettingsPath(): string {
  const homeDir = os.homedir()

  if (process.platform === 'darwin') {
    return path.join(
      homeDir,
      'Library',
      'Application Support',
      'Code',
      'User',
      'settings.json'
    )
  }

  if (process.platform === 'win32') {
    const appData =
      process.env.APPDATA ?? path.join(homeDir, 'AppData', 'Roaming')
    return path.join(appData, 'Code', 'User', 'settings.json')
  }

  return path.join(homeDir, '.config', 'Code', 'User', 'settings.json')
}

/** Template for Claude settings.json */
const CLAUDE_SETTINGS_TEMPLATE = `{
  "env": {
    "DISABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "ANTHROPIC_API_KEY": "API_KEY_PLACEHOLDER",
    "ANTHROPIC_BASE_URL": "${CLAUDE_BASE_URL}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "includeCoAuthoredBy": false,
  "apiKeyHelper": "echo 'API_KEY_PLACEHOLDER'",
  "permissions": {
    "allow": [],
    "deny": []
  }
}`

/** Update VSCode Claude extension settings.json */
function writeVSCodeClaudePluginConfig(apiKey: string): {
  settingsPath: string
} {
  const settingsPath = getVSCodeUserSettingsPath()
  ensureDir(path.dirname(settingsPath))

  const originalContent = fs.existsSync(settingsPath)
    ? fs.readFileSync(settingsPath, 'utf8')
    : '{}'
  const sourceContent =
    originalContent.trim().length === 0 ? '{}' : originalContent

  const parseErrors: ParseError[] = []
  const parsedSettings = parse(sourceContent, parseErrors, {
    allowTrailingComma: true,
    disallowComments: false,
  })
  if (parseErrors.length > 0) {
    throw new Error(
      `VSCode settings is not valid JSONC: ${settingsPath}. Please fix it and retry.`
    )
  }

  if (
    parsedSettings !== undefined &&
    (parsedSettings === null ||
      typeof parsedSettings !== 'object' ||
      Array.isArray(parsedSettings))
  ) {
    throw new Error(
      `VSCode settings root must be a JSON object: ${settingsPath}.`
    )
  }

  const edits = modify(
    sourceContent,
    ['claudeCode.environmentVariables'],
    [
      { name: 'ANTHROPIC_BASE_URL', value: CLAUDE_BASE_URL },
      { name: 'ANTHROPIC_AUTH_TOKEN', value: apiKey },
      { name: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC', value: '1' },
    ],
    {
      formattingOptions: {
        insertSpaces: true,
        tabSize: 2,
        eol: '\n',
      },
    }
  )
  const updatedContent = applyEdits(sourceContent, edits)
  const contentWithTrailingNewline = updatedContent.endsWith('\n')
    ? updatedContent
    : `${updatedContent}\n`
  fs.writeFileSync(settingsPath, contentWithTrailingNewline)

  return { settingsPath }
}

/** Write Claude config files */
export function writeClaudeConfig(apiKey: string): {
  settingsPath: string
  vscodeSettingsPath: string
} {
  // Write Claude settings
  const settingsDir = getClaudeSettingsDir()
  const settingsPath = path.join(settingsDir, 'settings.json')
  ensureDir(settingsDir)
  const settingsContent = CLAUDE_SETTINGS_TEMPLATE.replace(
    /API_KEY_PLACEHOLDER/g,
    apiKey
  )
  fs.writeFileSync(settingsPath, settingsContent)

  const vscodeResult = writeVSCodeClaudePluginConfig(apiKey)

  return { settingsPath, vscodeSettingsPath: vscodeResult.settingsPath }
}

/** Install global dependencies */
export async function installDeps(): Promise<void> {
  const packages = ['@anthropic-ai/claude-code']
  const usePnpm = await commandExists('pnpm')

  if (usePnpm) {
    console.log('pnpm detected. Installing dependencies with pnpm...')
    await execa('pnpm', ['add', '-g', ...packages], {
      stdio: 'inherit',
      env: PNPM_INSTALL_ENV,
    })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }
  console.log('Dependencies installed successfully.')
}
