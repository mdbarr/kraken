#!/usr/bin/env node
'use strict';

require('barrkeep/pp');

const fs = require('fs');
const path = require('path');
const util = require('util');
//const yaml = require('js-yaml');
const minimist = require('minimist');
const style = require('barrkeep/style');
const { Uscript } = require('@mdbarr/uscript');
const mkdirp = util.promisify(require('mkdirp'));
const rimraf = util.promisify(require('rimraf'));
const exec = util.promisify(require('child_process').exec);

const WORKSPACE = process.env.WORKSPACE || path.join(process.cwd(), './work');

//////////

function output(...args) {
  process.stdout.write(`${ args.join('\n') }\n`);
}

function prompt(...args) {
  output(style('[', 'fg:grey; style:bold') +
         style('kraken', 'fg: seagreen3; style: bold') +
         style('] ', 'fg:grey; style:bold') + args.join(' '));
}

function comment(...args) {
  prompt(style(`# ${ args.join(' ') }`, 'grey'));
}

function Kraken(options = {}) {
  const kraken = this;

  const verbose = Boolean(options.verbose);
  const dryrun = Boolean(options['dry-run'] || options.dryRun);

  kraken.version = require('./package').version;

  //////////

  kraken.modules = require('./modules');

  kraken.prep = function(step, frame, shallow = false) {
    for (const property in step) {
      if (typeof step[property] === 'string') {
        step[property] = kraken.handlebars(step[property], frame);
      } else if (!shallow && typeof step[property] === 'object' && step[property] !== null) {
        kraken.prep(step[property], frame, shallow);
      }
    }
  };

  kraken.when = function(object, frame) {
    if (object.when !== undefined) {
      const when = kraken.handlebars(object.when, frame);
      // console.log('[WHEN]', object.when, when);

      if (!when || when === 'false' || when === 'undefined' ||
          when === 'null' || when === '0') {
        return false;
      }
      return true;
    }
    return true;
  };

  kraken.step = async function(object) {
    if (verbose && object.name) {
      comment(object.name);
    }

    // console.pp(object);
    if (object.foreach && object.steps) {
      const [ , variable, which ] = object.foreach.match(/^(.*?)\s+in\s+(.*?)$/i);

      const container = kraken.uscript.eval(which);
      for (const item in container) {
        const frame = Object.assign({ [variable]: item }, container[item]);

        // console.pp(frame);

        // console.log('WHEN', object.when);
        if (!kraken.when(object, frame)) {
          continue;
        }
        // console.log('WHEN<<');

        if (object.cwd) {
          kraken.cd(object.cwd, frame);
        }

        for (let step of object.steps) {
          step = Object.assign({}, step);
          kraken.prep(step, frame, true);

          await kraken.step(step);
        }

        kraken.cd();
      }
    } else if (object.steps) {
      // console.log('WHEN', object.when);
      if (!kraken.when(object)) {
        return false;
      }
      // console.log('WHEN<<');

      if (object.cwd) {
        kraken.cd(object.cwd);
      }

      for (let step of object.steps) {
        step = Object.assign({}, step);
        kraken.prep(step);

        await kraken.step(step);
      }

      kraken.cd();
    } else {
      kraken.prep(object);

      for (const module in kraken.modules) {
        if (object.hasOwnProperty(module)) {
          // console.log(`[${ module }] ${ object[module] }`);

          if (!kraken.when(object)) {
            continue;
          }

          if (object.cwd) {
            kraken.cd(object.cwd);
          }

          // Try / Catch?
          const result = await kraken.modules[module](kraken, object);

          kraken.cd();

          return result;
        }
      }
    }
    // Unknown step
    return null;
  };

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
  kraken.steps = require('./playbook');

  //// console.log(yaml.safeDump(kraken.steps));
  //process.exit(0);

  kraken.environment = {
    workspace: WORKSPACE,
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

  kraken.handlebars = function(string, env) {
    return string.replace(/{{(.*?)}}/g, (match, expression) => {
      return kraken.uscript.eval(expression.trim(), env);
    });
  };

  kraken.exec = async function(command, commandOptions) {
    if (dryrun) {
      prompt(command);
      return command;
    }

    const result = await exec(command, commandOptions).toString();
    kraken.log.push(result);
    // console.log(result.stdout);
    return result.stdout;
  };

  kraken.mkdir = async function(directory) {
    if (dryrun) {
      prompt('mkdir -p', directory);
    } else {
      await mkdirp(directory);
    }

    return true;
  };

  kraken.rimraf = async function(item) {
    if (dryrun) {
      prompt('rm -rf', item);
    } else {
      await rimraf(item);
    }
    return true;
  };

  kraken.$directories = [];
  kraken.cd = function(directory, frame) {
    if (directory === undefined || directory === '-') {
      const change = kraken.$directories.unshift();

      //process.chdir(change.from);
      kraken.environment.cwd = change.from;
      return change.from;
    }

    directory = kraken.handlebars(directory, frame);

    const cwd = path.resolve(directory);

    const change = {
      from: process.cwd(),
      to: cwd
    };

    kraken.$directories.push(change);

    if (dryrun) {
      prompt('cd', change.to);
    } else {
      process.chdir(change.to);
    }
    kraken.environment.cwd = change.to;
    return change.to;
  };

  kraken.start = async function() {
    const [ width ] = process.stdout.getWindowSize();

    const indent = ' '.repeat(Math.floor((width - 40) / 2));

    const banner = fs.readFileSync('kraken-logo.txt').toString().
      replace(/\\e/g, '\u001b').
      replace(/^/mg, indent);

    output();
    output(banner);
    output();
    output(`Kraken Release Engineering v${ kraken.version }`);
    output();

    await kraken.mkdir(kraken.environment.workspace);

    kraken.cd(kraken.environment.workspace);

    // Steps
    for (const step of kraken.steps) {
      // console.log(step);
      await kraken.step(step);
    }

    kraken.cd();
    await kraken.rimraf('./work'); // always?
  };
}

const args = minimist(process.argv.slice(2));

args['dry-run'] = true;
args.verbose = true;

const kraken = new Kraken(args);
kraken.start();
