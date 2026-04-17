import { writeClaudeConfig, installDeps } from './claude-code'
import { writeCodexConfig, installCodexDeps } from './codex'
import { writeGeminiConfig, installGeminiDeps } from './gemini-cli'
import { writeOpencodeConfig, installOpencodeDeps } from './opencode'

export interface AllAgentsOptions {
  /** When true, also include OpenCode and Gemini CLI in the combined setup. */
  full?: boolean
}

export interface AllAgentsResult {
  claude: { settingsPath: string; vscodeSettingsPath: string }
  codex: { configPath: string; authPath: string; catalogPath: string }
  opencode?: { configPath: string }
  gemini?: { envPath: string; settingsPath: string }
}

/** Write configuration for the combined setup (Claude Code + Codex; optional OpenCode + Gemini CLI with --full). */
export async function writeAllAgentsConfig(
  apiKey: string,
  options: AllAgentsOptions = {}
): Promise<AllAgentsResult> {
  const claudeResult = writeClaudeConfig(apiKey)
  const codexResult = await writeCodexConfig(apiKey)

  const result: AllAgentsResult = {
    claude: claudeResult,
    codex: codexResult,
  }

  if (options.full) {
    result.opencode = writeOpencodeConfig(apiKey)
    result.gemini = writeGeminiConfig(apiKey)
  }

  return result
}

/** Install dependencies for the combined setup (Claude Code + Codex; optional OpenCode + Gemini CLI with --full). */
export async function installAllAgentsDeps(
  options: AllAgentsOptions = {}
): Promise<void> {
  const installers = [installDeps(), installCodexDeps()]
  if (options.full) {
    installers.push(installOpencodeDeps(), installGeminiDeps())
  }
  await Promise.all(installers)
}
