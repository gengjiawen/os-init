import { writeClaudeConfig } from './claude-code'
import { writeCodexConfig } from './codex'
import { writeGeminiConfig } from './gemini-cli'
import { writeOpencodeConfig } from './opencode'
import { execa } from 'execa'
import { commandExists, PNPM_INSTALL_ENV } from './utils'

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
  const packages = ['@anthropic-ai/claude-code', '@openai/codex']
  if (options.full) {
    packages.push('opencode-ai', '@google/gemini-cli')
  }

  const usePnpm = await commandExists('pnpm')

  if (usePnpm) {
    console.log('pnpm detected. Installing agent dependencies with pnpm...')
    await execa('pnpm', ['add', '-g', ...packages], {
      stdio: 'inherit',
      env: PNPM_INSTALL_ENV,
    })
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }

  console.log('Agent dependencies installed successfully.')
}
