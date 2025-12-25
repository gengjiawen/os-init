import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'

/** Ensure directory exists */
function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

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

/** Check if a command exists */
async function commandExists(command: string): Promise<boolean> {
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

/** Return Codex configuration directory path */
function getCodexConfigDir(): string {
  return path.join(os.homedir(), '.codex')
}

/** Template for Codex config.toml */
const CODEX_CONFIG_TOML_TEMPLATE = `model_provider = "jw"
model = "gpt-5.1"
model_reasoning_effort = "high"
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.jw]
name = "jw"
base_url = "https://ai.gengjiawen.com/api/openai"
wire_api = "responses"
`

/** Write Codex config.toml and auth.json */
export function writeCodexConfig(apiKey: string): {
  configPath: string
  authPath: string
} {
  const configDir = getCodexConfigDir()
  ensureDir(configDir)

  const configPath = path.join(configDir, 'config.toml')
  fs.writeFileSync(configPath, CODEX_CONFIG_TOML_TEMPLATE)

  const authPath = path.join(configDir, 'auth.json')
  const authContent = JSON.stringify({ OPENAI_API_KEY: apiKey }, null, 2)
  fs.writeFileSync(authPath, authContent)

  return { configPath, authPath }
}

/** Install Codex dependency */
export async function installCodexDeps(): Promise<void> {
  const packages = ['@openai/codex']
  const usePnpm = await commandExists('pnpm')

  if (usePnpm) {
    console.log('pnpm detected. Installing Codex dependency with pnpm...')
    await execa('pnpm', ['add', '-g', ...packages], { stdio: 'inherit' })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }
  console.log('Codex dependency installed successfully.')
}

/** Return Raycast AI configuration directory path */
function getRaycastAIConfigDir(): string {
  return path.join(os.homedir(), '.config', 'raycast', 'ai')
}

/** Template for Raycast AI providers.yaml */
const RAYCAST_PROVIDERS_YAML_TEMPLATE = `providers:
  - id: my_provider
    name: gengjiawen AI
    base_url: https://ai.gengjiawen.com/api/openai/v1/
    api_keys:
      openai: API_KEY_PLACEHOLDER
    models:
      - id: sota
        name: "sota"
        context: 200000
        provider: openai
        abilities:
          temperature:
            supported: true
          vision:
            supported: true
          system_message:
            supported: true
          tools:
            supported: true
`

/** Write Raycast AI providers.yaml */
export function writeRaycastConfig(apiKey: string): { configPath: string } {
  const configDir = getRaycastAIConfigDir()
  ensureDir(configDir)

  const configPath = path.join(configDir, 'providers.yaml')
  const content = RAYCAST_PROVIDERS_YAML_TEMPLATE.replace(
    'API_KEY_PLACEHOLDER',
    apiKey
  )
  fs.writeFileSync(configPath, content)

  return { configPath }
}

// Re-export dev-setup functionality
export { setupDevEnvironment } from './dev-setup'

// Re-export android-setup functionality
export { setupAndroidEnvironment } from './android-setup'
