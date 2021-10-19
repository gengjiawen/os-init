#!/usr/bin/env node

const program = require('commander')

const { init, list } = require('../build')

program
  .version(require('../package.json').version)
  .command('init')
  .action(() => {
    init()
  })

program
  .version(require('../package.json').version)
  .command('list')
  .action(() => {
    list()
  })

program.parse(process.argv)
