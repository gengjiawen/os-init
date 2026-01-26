import { writeClaudeConfig, installDeps } from './claude-code'
import { writeCodexConfig, installCodexDeps } from './codex'
import { writeGeminiConfig, installGeminiDeps } from './gemini-cli'

export interface AllAgentsOptions {
  /** When true, also include Gemini CLI in the combined setup. */
  full?: boolean
}

export interface AllAgentsResult {
  claude: { settingsPath: string }
  codex: { configPath: string; authPath: string }
  gemini?: { envPath: string; settingsPath: string }
}

/** Write configuration for the combined setup (Claude Code + Codex, optional Gemini CLI). */
export function writeAllAgentsConfig(
  apiKey: string,
  options: AllAgentsOptions = {}
): AllAgentsResult {
  const claudeResult = writeClaudeConfig(apiKey)
  const codexResult = writeCodexConfig(apiKey)

  const result: AllAgentsResult = {
    claude: claudeResult,
    codex: codexResult,
  }

  if (options.full) {
    result.gemini = writeGeminiConfig(apiKey)
  }

  return result
}

/** Install dependencies for the combined setup (Claude Code + Codex, optional Gemini CLI). */
export async function installAllAgentsDeps(
  options: AllAgentsOptions = {}
): Promise<void> {
  const installers = [installDeps(), installCodexDeps()]
  if (options.full) installers.push(installGeminiDeps())
  await Promise.all(installers)
}
