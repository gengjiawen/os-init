import { writeClaudeConfig } from './claude-code'
import { writeCodexConfig } from './codex'
import { writeOpencodeConfig } from './opencode'
import { execa } from 'execa'
import { commandExists, PNPM_INSTALL_ENV } from './utils'

export interface AllAgentsOptions {
  /** When true, also include OpenCode in the combined setup. */
  full?: boolean
}

export interface AllAgentsResult {
  claude: { settingsPath: string; vscodeSettingsPath: string }
  codex: { configPath: string; authPath: string; catalogPath: string }
  opencode?: { configPath: string }
}

/** Write configuration for the combined setup (Claude Code + Codex; optional OpenCode with --full). */
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
  }

  return result
}

/** Install dependencies for the combined setup (Claude Code + Codex; optional OpenCode with --full). */
export async function installAllAgentsDeps(
  options: AllAgentsOptions = {}
): Promise<void> {
  const packages = ['@anthropic-ai/claude-code', '@openai/codex']
  if (options.full) {
    packages.push('opencode-ai')
  }

  const usePnpm = await commandExists('pnpm')

  if (usePnpm) {
    console.log('pnpm detected. Installing agent dependencies with pnpm...')
    await execa(
      'pnpm',
      ['--allow-build=@anthropic-ai/claude-code', 'add', '-g', ...packages],
      {
        stdio: 'inherit',
        env: PNPM_INSTALL_ENV,
      }
    )
  } else {
    console.log('pnpm not found. Falling back to npm...')
    await execa('npm', ['install', '-g', ...packages], { stdio: 'inherit' })
  }

  console.log('Agent dependencies installed successfully.')
}
