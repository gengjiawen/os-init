import { writeClaudeConfig, installDeps } from './claude-code'
import { writeCodexConfig, installCodexDeps } from './codex'
import { writeGeminiConfig, installGeminiDeps } from './gemini-cli'

export interface AllAgentsResult {
  claude: { settingsPath: string }
  codex: { configPath: string; authPath: string }
  gemini: { envPath: string; settingsPath: string }
}

/** Write configuration for all three agents (Claude Code, Codex, Gemini CLI) */
export function writeAllAgentsConfig(apiKey: string): AllAgentsResult {
  const claudeResult = writeClaudeConfig(apiKey)
  const codexResult = writeCodexConfig(apiKey)
  const geminiResult = writeGeminiConfig(apiKey)

  return {
    claude: claudeResult,
    codex: codexResult,
    gemini: geminiResult,
  }
}

/** Install dependencies for all three agents */
export async function installAllAgentsDeps(): Promise<void> {
  await Promise.all([installDeps(), installCodexDeps(), installGeminiDeps()])
}
