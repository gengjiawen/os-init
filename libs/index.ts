import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'

/** Return default configuration directory path */
function getDefaultConfigDir(): string {
  return path.join(os.homedir(), '.claude-code-router')
}

/** Ensure directory exists */
function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

/** Template string used for simple string replacement */
const DEFAULT_TEMPLATE = `{
  "Providers": [
    {
      "name": "jw",
      "api_base_url": "https://ai.gengjiawen.com/api/openai/v1/chat/completions",
      "api_key": "API_KEY_PLACEHOLDER",
      "models": ["code", "free", "free-thinking"],
      "transformer": {
        "use": ["openrouter"]
      }
    }
  ],
  "Router": {
    "default": "jw,code",
    "background": "jw,code",
    "think": "jw,code",
    "longContext": "jw,code"
  }
}`

/** Write config by simple string replacement */
export function writeConfig(apiKey: string): string {
  const configDir = getDefaultConfigDir()
  const configPath = path.join(configDir, 'config.json')
  ensureDir(configDir)
  const content = DEFAULT_TEMPLATE.replace('API_KEY_PLACEHOLDER', apiKey)
  fs.writeFileSync(configPath, content)
  return configPath
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
  const packages = [
    '@anthropic-ai/claude-code',
    '@musistudio/claude-code-router',
  ]
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
model = "gpt-5"
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
