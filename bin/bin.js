#!/usr/bin/env node

const { Command } = require('commander')
const {
  writeClaudeConfig,
  installDeps,
  writeCodexConfig,
  installCodexDeps,
  writeRaycastConfig,
  setupDevEnvironment,
  setupAndroidEnvironment,
} = require('../build')
const { appendFishImportScript } = require('../build/fish-shell-utils')

const program = new Command()

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
      const { settingsPath } = writeClaudeConfig(apiKey)
      console.log(`Claude settings written to: ${settingsPath}`)
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

program.parse(process.argv)
