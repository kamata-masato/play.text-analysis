#!/usr/bin/env node

import { Command } from 'commander'
import { build } from './commands/build.js'

const command = new Command()

command.name('glossa').version('0.1.0')

build(command)

command.parse()
