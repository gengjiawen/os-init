import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as TOML from '@iarna/toml'
import { execa } from 'execa'
import { ensureDir, commandExists, PNPM_INSTALL_ENV } from './utils'

type TomlTable = ReturnType<typeof TOML.parse>

const CODEX_BASE_URL = 'https://ai.gengjiawen.com/api/openai'

/** Return Codex configuration directory path */
function getCodexConfigDir(): string {
  return path.join(os.homedir(), '.codex')
}

function getCodexConfigTomlTemplate(): string {
  return `model_provider = "jw"
model = "gpt-5.5"
model_reasoning_effort = "xhigh"
plan_mode_reasoning_effort = "xhigh"
model_auto_compact_token_limit = 131072
disable_response_storage = true
preferred_auth_method = "apikey"

[model_providers.jw]
name = "jw"
base_url = "${CODEX_BASE_URL}"
wire_api = "responses"
`
}

function isTomlTable(value: unknown): value is TomlTable {
  return (
    value !== undefined &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  )
}

function mergeTomlTables(
  existingConfig: TomlTable,
  templateConfig: TomlTable
): TomlTable {
  const mergedConfig: TomlTable = { ...existingConfig }

  for (const [key, templateValue] of Object.entries(templateConfig)) {
    const existingValue = mergedConfig[key]

    mergedConfig[key] =
      isTomlTable(existingValue) && isTomlTable(templateValue)
        ? mergeTomlTables(existingValue, templateValue)
        : templateValue
  }

  return mergedConfig
}

function getMergedCodexConfig(existingContent: string): string {
  const existingConfig = TOML.parse(existingContent) as TomlTable
  const templateConfig = TOML.parse(getCodexConfigTomlTemplate()) as TomlTable
  delete existingConfig.service_tier
  delete existingConfig.model_catalog_json

  return TOML.stringify(mergeTomlTables(existingConfig, templateConfig))
}

/** Write Codex config.toml and auth.json */
export function writeCodexConfig(apiKey: string): {
  configPath: string
  authPath: string
} {
  const configDir = getCodexConfigDir()
  ensureDir(configDir)

  const configPath = path.join(configDir, 'config.toml')
  const configContent = fs.existsSync(configPath)
    ? getMergedCodexConfig(fs.readFileSync(configPath, 'utf8'))
    : getCodexConfigTomlTemplate()
  fs.writeFileSync(configPath, configContent)

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
    await execa('pnpm', ['add', '-g', ...packages], {
      stdio: 'inherit',
      env: PNPM_INSTALL_ENV,
    })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }
  console.log('Codex dependency installed successfully.')
}
