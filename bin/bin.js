#!/usr/bin/env node

const { Command } = require('commander')
const { writeConfig, installDeps } = require('../build')

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
      const configPath = writeConfig(apiKey)
      console.log(`Config written to: ${configPath}`)
      await installDeps()
    } catch (err) {
      console.error('Failed to complete setup:', err.message)
      process.exit(1)
    }
  })

program.parse(process.argv)
