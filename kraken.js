#!/usr/bin/env node
'use strict';

require('barrkeep/pp');

const fs = require('fs');
const yaml = require('js-yaml');
const minimist = require('minimist');
const { execSync } = require('child_process');
const { Uscript } = require('@mdbarr/uscript');

const WORKSPACE = process.env.WORKSPACE || process.cwd();

//////////

function Kraken(options = {}) {
  const kraken = this;

  kraken.version = require('./package').version;

  //////////

  const version = options.tag || options.version;
  const nightly = Boolean(options.nightly);
  const release = Boolean(options.release);

  let prefix = options.prefix;
  if (!prefix) {
    if (nightly) {
      prefix = 'nightly';
    } else if (release) {
      prefix = 'rel';
    } else {
      prefix = 'pr';
    }
  }

  const tag = `${ prefix }-${ version }`;
  const message = options.message || `Pike ADK ${ tag } Release`;

  //////////

  kraken.config = require('./config');
  kraken.steps = require('./release');

  kraken.environment = {
    WORKSPACE,
    config: kraken.config,
    message,
    nightly,
    options,
    prefix,
    release,
    tag,
    version
  };

  kraken.log = [];

  kraken.uscript = new Uscript({ environment: kraken.environment });

  const handlebars = function(string, env) {
    return string.replace(/{{(.*?)}}/g, (match, expression) => {
      return kraken.uscript.eval(expression.trim(), env);
    });
  };

  kraken.exec = function(command, commandOptions) {
    if (options['dry-run'] || options.dryRun) {
      console.log('[TEST] >', command);
    } else {
      const result = execSync(command, commandOptions);
      kraken.log.push(result);
      console.log(result);
    }
  };

  kraken.start = function() {
    const [ width ] = process.stdout.getWindowSize();

    const indent = ' '.repeat(Math.floor((width - 40) / 2));

    const banner = fs.readFileSync('kraken-logo.txt').toString().
      replace(/\\e/g, '\u001b').
      replace(/^/mg, indent);

    console.log();
    console.log(banner);
    console.log();
    console.log(`Kraken Release Engineering v${ kraken.version }`);
    console.log();

    process.cwd('./tmp');

    // Steps

    for (const step of steps) {

    }

    //

    process.cwd(__dirname);
  };
}

const args = minimist(process.argv.slice(2));
const kraken = new Kraken(args);
kraken.start();
