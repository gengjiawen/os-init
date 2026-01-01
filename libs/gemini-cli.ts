import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execa } from 'execa'
import { ensureDir, commandExists } from './utils'

/** Return Gemini CLI configuration directory path */
function getGeminiConfigDir(): string {
  return path.join(os.homedir(), '.gemini')
}

/** Template for Gemini CLI .env file */
const GEMINI_ENV_TEMPLATE = `GOOGLE_GEMINI_BASE_URL=https://ai.gengjiawen.com/api/gemini
GEMINI_API_KEY=API_KEY_PLACEHOLDER
GEMINI_MODEL=gemini-3-pro-preview
`

/** Template for Gemini CLI settings.json */
const GEMINI_SETTINGS_TEMPLATE = {
  ide: {
    enabled: true,
  },
  security: {
    auth: {
      selectedType: 'gemini-api-key',
    },
  },
}

/** Write Gemini CLI config files (.env and settings.json) */
export function writeGeminiConfig(apiKey: string): {
  envPath: string
  settingsPath: string
} {
  const configDir = getGeminiConfigDir()
  ensureDir(configDir)

  // Write .env file
  const envPath = path.join(configDir, '.env')
  const envContent = GEMINI_ENV_TEMPLATE.replace('API_KEY_PLACEHOLDER', apiKey)
  fs.writeFileSync(envPath, envContent)

  // Write settings.json file
  const settingsPath = path.join(configDir, 'settings.json')
  fs.writeFileSync(
    settingsPath,
    JSON.stringify(GEMINI_SETTINGS_TEMPLATE, null, 2)
  )

  return { envPath, settingsPath }
}

/** Install Gemini CLI dependency */
export async function installGeminiDeps(): Promise<void> {
  const usePnpm = await commandExists('pnpm')
  const geminiPackage = '@google/gemini-cli'

  if (usePnpm) {
    console.log('pnpm detected. Installing Gemini CLI with pnpm...')
    await execa('pnpm', ['add', '-g', geminiPackage], { stdio: 'inherit' })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', geminiPackage], { stdio: 'inherit' })
  }
  console.log('Gemini CLI installed successfully.')
}
