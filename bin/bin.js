#!/usr/bin/env node

const { Command } = require('commander')
const {
  writeClaudeConfig,
  installDeps,
  writeCodexConfig,
  installCodexDeps,
} = require('../build')

const program = new Command()

program
  .command('set-cc')
  .description('setup claude-code-router')
  .argument('<apiKey>', 'API key to set')
  .action(async (apiKey) => {
    // Ensure apiKey is provided
    if (!apiKey || String(apiKey).trim().length === 0) {
      console.error('Missing required argument: <apiKey>')
      program.help({ error: true })
      return
    }
    try {
      const { routerConfigPath, settingsPath } = writeClaudeConfig(apiKey)
      console.log(`Claude router config written to: ${routerConfigPath}`)
      console.log(`Claude settings written to: ${settingsPath}`)
      await installDeps()
    } catch (err) {
      console.error('Failed to complete setup:', err.message)
      process.exit(1)
    }
    console.log('use `ccr code` in terminal to start building')
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

program.parse(process.argv)
