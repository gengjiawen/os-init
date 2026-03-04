import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { execa } from 'execa'
import { commandExists, ensureDir, PNPM_INSTALL_ENV } from './utils'

const OPENCODE_PROVIDER_ID = 'MyCustomProvider'
const OPENCODE_MODEL_ID = 'code'
const OPENCODE_GLM_MODEL_ID = 'glm'
const OPENCODE_KIMI_MODEL_ID = 'kimi'
const OPENCODE_BASE_URL = 'https://ai.gengjiawen.com/api/openai/v1'

/** Return OpenCode configuration directory path */
function getOpencodeConfigDir(): string {
  return path.join(os.homedir(), '.config', 'opencode')
}

/** Write OpenCode config file */
export function writeOpencodeConfig(apiKey: string): { configPath: string } {
  const configDir = getOpencodeConfigDir()
  ensureDir(configDir)

  const configContent = {
    $schema: 'https://opencode.ai/config.json',
    provider: {
      [OPENCODE_PROVIDER_ID]: {
        npm: '@ai-sdk/openai-compatible',
        name: 'JWProvider',
        options: {
          baseURL: OPENCODE_BASE_URL,
          apiKey,
        },
        models: {
          [OPENCODE_MODEL_ID]: {
            name: OPENCODE_MODEL_ID,
          },
          [OPENCODE_GLM_MODEL_ID]: {
            name: OPENCODE_GLM_MODEL_ID,
          },
          [OPENCODE_KIMI_MODEL_ID]: {
            name: OPENCODE_KIMI_MODEL_ID,
          },
        },
      },
    },
    model: `${OPENCODE_PROVIDER_ID}/${OPENCODE_MODEL_ID}`,
    small_model: `${OPENCODE_PROVIDER_ID}/${OPENCODE_MODEL_ID}`,
  }

  const configPath = path.join(configDir, 'opencode.json')
  fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2))

  return { configPath }
}

/** Install OpenCode dependency */
export async function installOpencodeDeps(): Promise<void> {
  const packages = ['opencode-ai']
  const usePnpm = await commandExists('pnpm')

  if (usePnpm) {
    console.log('pnpm detected. Installing OpenCode dependency with pnpm...')
    await execa('pnpm', ['add', '-g', ...packages], {
      stdio: 'inherit',
      env: PNPM_INSTALL_ENV,
    })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }
  console.log('OpenCode dependency installed successfully.')
}
