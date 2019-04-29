#!/usr/bin/env node
'use strict';

require('barrkeep/pp');

const fs = require('fs');
const path = require('path');
//const yaml = require('js-yaml');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const minimist = require('minimist');
const { execSync } = require('child_process');
const { Uscript } = require('@mdbarr/uscript');

const WORKSPACE = process.env.WORKSPACE || path.join(process.cwd(), './work');

//////////

function Kraken(options = {}) {
  const kraken = this;

  kraken.version = require('./package').version;

  //////////

  kraken.modules = require('./modules');

  kraken.prep = function(step, frame) {
    for (const property in step) {
      if (typeof step[property] === 'string') {
        step[property] = kraken.handlebars(step[property], frame);
      }
    }
  };

  kraken.when = function(object, frame) {
    if (object.when !== undefined) {
      const when = kraken.handlebars(object.when, frame);
      console.log('[WHEN]', object.when, when);

      if (!when || when === 'false' || when === 'undefined' ||
          when === 'null' || when === '0') {
        return false;
      }
      return true;
    }
    return true;
  };

  kraken.step = function(object) {
    console.pp(object);
    if (object.foreach && object.steps) {
      const steps = [];

      const [ , variable, which ] = object.foreach.match(/^(.*?)\s+in\s+(.*?)$/i);

      const container = kraken.uscript.eval(which);
      for (const item in container) {
        const frame = Object.assign({ [variable]: item }, container[item]);

        console.pp(frame);

        console.log('WHEN', object.when);
        if (!kraken.when(object, frame)) {
          continue;
        }
        console.log('WHEN<<');

        if (object.cwd) {
          kraken.cd(object.cwd, frame);
        }

        for (let step of object.steps) {
          step = Object.assign({}, step);
          kraken.prep(step, frame);

          steps.push(step);
        }
        steps.reverse();
        steps.forEach(kraken.step);

        kraken.cd();
      }
    } else {
      for (const module in kraken.modules) {
        if (object.hasOwnProperty(module)) {
          console.log(`[${ module }] ${ object[module] }`);

          if (!kraken.when(object)) {
            continue;
          }

          if (object.cwd) {
            kraken.cd(object.cwd);
          }

          // Try / Catch?
          const result = kraken.modules[module](kraken, object);

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
  kraken.steps = require('./release');

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

  kraken.exec = function(command, commandOptions) {
    if (options['dry-run'] || options.dryRun) {
      console.log('[TEST] >', command);
    } else {
      console.log('[EXEC] >', command);
      const result = execSync(command, commandOptions).toString();
      kraken.log.push(result);
      console.log(result);
    }
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

    //process.chdir(change.to);
    kraken.environment.cwd = change.to;
    return change.to;
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

    mkdirp.sync(kraken.environment.workspace);
    kraken.cd(kraken.environment.workspace);

    // Steps

    for (const step of kraken.steps) {
      console.log(step);
      kraken.step(step);
    }

    //

    process.chdir(__dirname);
    rimraf.sync('./work');
  };
}

const args = minimist(process.argv.slice(2));

args['dry-run'] = true;

const kraken = new Kraken(args);
kraken.start();
