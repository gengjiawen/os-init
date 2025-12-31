import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { ensureDir } from './utils'

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

// Re-export claude-code functionality
export { writeClaudeConfig, installDeps } from './claude-code'

// Re-export codex functionality
export { writeCodexConfig, installCodexDeps } from './codex'

// Re-export dev-setup functionality
export { setupDevEnvironment } from './dev-setup'

// Re-export android-setup functionality
export { setupAndroidEnvironment } from './android-setup'
