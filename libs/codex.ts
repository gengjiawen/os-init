import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import { ensureDir, commandExists } from './utils'

/** Return Codex configuration directory path */
function getCodexConfigDir(): string {
  return path.join(os.homedir(), '.codex')
}

/** Template for Codex config.toml */
const CODEX_CONFIG_TOML_TEMPLATE = `model_provider = "jw"
model = "gpt-5.3-codex"
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
