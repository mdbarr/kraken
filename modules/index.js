'use strict';

const index = require('requireindex')(__dirname);

const modules = {};

for (const item in index) {
  if (typeof index[item] === 'function') {
    modules[item] = index[item];
  } else if (typeof index[item] === 'object') {
    Object.assign(modules, index[item]);
  }
}

module.exports = modules;
