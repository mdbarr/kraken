'use strict';

function fetch(kraken, step) {
  let command = 'git fetch';

  if (typeof step.fetch === 'string') {
    command += ` ${ step.fetch }`;
  }

  if (step.all) {
    command += ' --all';
  }

  if (step.tags) {
    command += ' --tags';
  }

  const result = kraken.exec(command);

  return result;
}

module.exports = fetch;
