import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import { ensureDir, commandExists } from './utils'

/** Return Claude settings directory path */
function getClaudeSettingsDir(): string {
  return path.join(os.homedir(), '.claude')
}

/** Template for Claude settings.json */
const CLAUDE_SETTINGS_TEMPLATE = `{
  "env": {
    "DISABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "ANTHROPIC_API_KEY": "API_KEY_PLACEHOLDER",
    "ANTHROPIC_BASE_URL": "https://ai.gengjiawen.com/api/claude/",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "includeCoAuthoredBy": false,
  "apiKeyHelper": "echo 'API_KEY_PLACEHOLDER'",
  "permissions": {
    "allow": [],
    "deny": []
  }
}`

/** Write Claude config files */
export function writeClaudeConfig(apiKey: string): {
  settingsPath: string
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

  return { settingsPath }
}

/** Install global dependencies */
export async function installDeps(): Promise<void> {
  const packages = ['@anthropic-ai/claude-code']
  const usePnpm = await commandExists('pnpm')

  if (usePnpm) {
    console.log('pnpm detected. Installing dependencies with pnpm...')
    await execa('pnpm', ['add', '-g', ...packages], { stdio: 'inherit' })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }
  console.log('Dependencies installed successfully.')
}
