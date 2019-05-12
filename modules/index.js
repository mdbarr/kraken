'use strict';

const glob = require('glob');

const modules = {};

const modulesDirectory = __dirname;

const files = glob.sync(`${ modulesDirectory }/**/*.js`);

for (const file of files) {
  const name = file.replace(modulesDirectory, '').
    replace(/^\//, '').
    replace(/\.js$/, '').
    replace(/\//g, '_');

  if (name === 'index') {
    continue;
  }

  console.log('got', file, name);
  const module = require(file);

  if (typeof module === 'function') {
    modules[name] = module;
  } else if (typeof module === 'object') {
    const shortName = name.replace(/_[^_]+$/g, '');
    for (const item in module) {
      const subName = `${ shortName }_${ item }`;
      modules[subName] = module[item];
    }
  }
}

module.exports = modules;
