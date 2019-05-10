'use strict';

async function clone(kraken, step) {
  let url;
  let branch = 'master';
  let recursive = false;

  if (typeof kraken.config[step.clone] === 'string') {
    url = kraken.config[step.clone];
  } else {
    url = kraken.config[step.clone].url;
  }

  if (kraken.config[step.clone].branch) {
    branch = kraken.config[step.clone].branch;
  }

  if (step.recursive || kraken.config[step.clone].recursive) {
    recursive = true;
  }

  let steps;

  if (step.root) {
    steps = [
      'git init',
      `git remote add origin ${ url }`,
      'git fetch --all --prune',
      `git checkout -f ${ branch }`
    ];

    if (recursive) {
      steps.push('git submodule update --init');
    }
  } else {
    steps = [
      recursive ? `git clone ${ url } --recurse-submodules` : `git clone ${ url }`,
      `cd ${ step.clone }`
    ];
  }

  let result = '';
  for (const substep of steps) {
    result += await kraken.exec(substep);
  }

  return result;
}

module.exports = clone;
