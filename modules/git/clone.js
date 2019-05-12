'use strict';

async function clone(kraken, step) {
  let url;
  let branch = 'master';
  let recursive = false;

  if (typeof kraken.config[step.git_clone] === 'string') {
    url = kraken.config[step.git_clone];
  } else {
    url = kraken.config[step.git_clone].url;
  }

  if (kraken.config[step.git_clone].branch) {
    branch = kraken.config[step.git_clone].branch;
  }

  if (step.recursive || kraken.config[step.git_clone].recursive) {
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
      `cd ${ step.git_clone }`
    ];
  }

  let result = '';
  for (const substep of steps) {
    result += await kraken.exec(substep);
  }

  return result;
}

module.exports = clone;
