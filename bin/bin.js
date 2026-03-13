#!/usr/bin/env node

const { Command } = require('commander')
const path = require('path')
const {
  writeClaudeConfig,
  installDeps,
  writeCodexConfig,
  installCodexDeps,
  writeGeminiConfig,
  installGeminiDeps,
  writeOpencodeConfig,
  installOpencodeDeps,
  writeAllAgentsConfig,
  installAllAgentsDeps,
  writeRaycastConfig,
  setupDevEnvironment,
  setupAndroidEnvironment,
  writeMihomoConfig,
  downloadMihomoBinary,
} = require('../build')
const { appendFishImportScript } = require('../build/fish-shell-utils')

const program = new Command()

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

program
  .command('set-cc')
  .description('setup Claude Code')
  .argument('<apiKey>', 'API key to set')
  .action(async (apiKey) => {
    // Ensure apiKey is provided
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }
    try {
      const { settingsPath, vscodeSettingsPath } = writeClaudeConfig(apiKey)
      console.log(`Claude settings written to: ${settingsPath}`)
      console.log(
        `VSCode Claude plugin settings written to: ${vscodeSettingsPath}`
      )
      await installDeps()
    } catch (err) {
      console.error('Failed to complete setup:', err.message)
      process.exit(1)
    }
    console.log(
      'Claude Code is ready, use `claude` in terminal to start building'
    )
  })

program
  .command('set-codex')
  .description('setup codex cli config and auth')
  .argument('<apiKey>', 'API key to set for Codex')
  .action(async (apiKey) => {
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }
    try {
      const { configPath, authPath } = writeCodexConfig(apiKey)
      console.log(`Codex config written to: ${configPath}`)
      console.log(`Codex auth written to: ${authPath}`)
      await installCodexDeps()
    } catch (err) {
      console.error('Failed to setup Codex:', err.message)
      process.exit(1)
    }
    console.log('Codex is ready. use `codex` in terminal to start building')
  })

program
  .command('set-gemini')
  .description('setup Gemini CLI config and auth')
  .argument('<apiKey>', 'API key to set for Gemini CLI')
  .action(async (apiKey) => {
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }
    try {
      const { envPath, settingsPath } = writeGeminiConfig(apiKey)
      console.log(`Gemini CLI env written to: ${envPath}`)
      console.log(`Gemini CLI settings written to: ${settingsPath}`)
      await installGeminiDeps()
    } catch (err) {
      console.error('Failed to setup Gemini CLI:', err.message)
      process.exit(1)
    }
    console.log(
      'Gemini CLI is ready. use `gemini` in terminal to start building'
    )
  })

program
  .command('set-opencode')
  .description('setup OpenCode CLI config and auth')
  .argument('<apiKey>', 'API key to set for OpenCode')
  .action(async (apiKey) => {
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }
    try {
      const { configPath } = writeOpencodeConfig(apiKey)
      console.log(`OpenCode config written to: ${configPath}`)
      await installOpencodeDeps()
    } catch (err) {
      console.error('Failed to setup OpenCode:', err.message)
      process.exit(1)
    }
    console.log(
      'OpenCode is ready. use `opencode` in terminal to start building'
    )
  })

program
  .command('set-agents')
  .description(
    'setup Claude Code, Codex, and OpenCode at once (use --full to include Gemini CLI)'
  )
  .argument('<apiKey>', 'API key to set for agents')
  .option('--full', 'Also setup Gemini CLI')
  .action(async (apiKey, options) => {
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }

    const full = Boolean(options.full)

    try {
      console.log(
        full
          ? 'Setting up Claude Code + Codex + OpenCode + Gemini CLI...\n'
          : 'Setting up Claude Code + Codex + OpenCode...\n'
      )

      const result = writeAllAgentsConfig(apiKey, { full })

      console.log('Claude Code:')
      console.log(`  Settings written to: ${result.claude.settingsPath}`)
      console.log(
        `  VSCode plugin settings written to: ${result.claude.vscodeSettingsPath}`
      )

      console.log('\nCodex:')
      console.log(`  Config written to: ${result.codex.configPath}`)
      console.log(`  Auth written to: ${result.codex.authPath}`)

      console.log('\nOpenCode:')
      console.log(`  Config written to: ${result.opencode.configPath}`)

      if (result.gemini) {
        console.log('\nGemini CLI:')
        console.log(`  Env written to: ${result.gemini.envPath}`)
        console.log(`  Settings written to: ${result.gemini.settingsPath}`)
      }

      console.log('\nInstalling dependencies...')
      await installAllAgentsDeps({ full })
    } catch (err) {
      console.error('Failed to setup agents:', err.message)
      process.exit(1)
    }

    console.log('\nSetup complete!')
    console.log('  - Use `claude` for Claude Code')
    console.log('  - Use `codex` for Codex')
    console.log('  - Use `opencode` for OpenCode')
    if (full) console.log('  - Use `gemini` for Gemini CLI')
  })

program
  .command('set-raycast-ai')
  .description('setup Raycast AI providers config')
  .argument('<apiKey>', 'API key to set for Raycast AI')
  .action(async (apiKey) => {
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }
    try {
      const { configPath } = writeRaycastConfig(apiKey)
      console.log(`Raycast AI config written to: ${configPath}`)
    } catch (err) {
      console.error('Failed to setup Raycast AI:', err.message)
      process.exit(1)
    }
    console.log('Raycast AI is ready to use')
  })

program
  .command('set-dev')
  .description('setup dev environment with SSH access')
  .argument('<sshPublicKey>', 'SSH public key to set')
  .option('-t, --target <dir>', 'Target directory for dev-setup')
  .action(async (sshPublicKey, options) => {
    if (!sshPublicKey || String(sshPublicKey).trim().length === 0) {
      console.error('Missing required argument: <sshPublicKey>')
      program.help({ error: true })
      return
    }
    try {
      const { targetPath } = await setupDevEnvironment(
        sshPublicKey,
        options.target
      )
      console.log(`\n✅ Dev environment setup completed at: ${targetPath}`)
    } catch (err) {
      console.error('Failed to setup dev environment:', err.message)
      process.exit(1)
    }
  })

program
  .command('set-android')
  .description('setup Android development environment (macOS and Linux)')
  .option('--android-home <path>', 'Custom Android SDK installation path')
  .option(
    '--skip-env-vars',
    'Skip adding environment variables to shell config'
  )
  .action(async (options) => {
    try {
      const { androidHome, envVarsAdded, shellRcFile } =
        await setupAndroidEnvironment({
          androidHome: options.androidHome,
          skipEnvVars: options.skipEnvVars,
        })
      console.log(`\n✅ Android SDK installed at: ${androidHome}`)
      if (envVarsAdded && shellRcFile) {
        console.log(`✅ Environment variables added to: ${shellRcFile}`)
      }
    } catch (err) {
      console.error('Failed to setup Android environment:', err.message)
      process.exit(1)
    }
  })

program
  .command('set-fish')
  .description('setup Fish shell to import environment variables from .bashrc')
  .action(async () => {
    try {
      appendFishImportScript()
      console.log('\n✅ Fish shell import script setup completed!')
    } catch (err) {
      console.error('Failed to setup Fish shell:', err.message)
      process.exit(1)
    }
  })

program
  .command('set-clash')
  .description('generate clash/mihomo config.yml in current directory')
  .option('-t, --target <path>', 'Target path for mihomo config.yml')
  .option('--download', 'Download Mihomo binary to the config directory')
  .action(async (options) => {
    try {
      const { configPath } = writeMihomoConfig(options.target)
      const resolvedConfigPath = path.resolve(configPath)
      let mihomoCommand = 'mihomo'

      if (options.download) {
        const { binaryPath, downloadUrl, version } = await downloadMihomoBinary(
          path.dirname(resolvedConfigPath)
        )
        mihomoCommand = path.resolve(binaryPath)
        console.log(`Mihomo download URL: ${downloadUrl}`)
        console.log(`Mihomo version: ${version}`)
        console.log(`Mihomo binary downloaded to: ${binaryPath}`)
      }

      const pm2Command = `pm2 start ${shellEscape(mihomoCommand)} --name mihomo -- -f ${shellEscape(resolvedConfigPath)} && pm2 save`
      console.log(`Clash config written to: ${configPath}`)
      console.log('Run Mihomo with pm2:')
      console.log(`  ${pm2Command}`)
    } catch (err) {
      console.error('Failed to generate Clash config:', err.message)
      process.exit(1)
    }
  })

program.parse(process.argv)
