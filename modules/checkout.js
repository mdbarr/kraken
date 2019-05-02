'use strict';

function checkout(kraken, step) {
  let command = 'git checkout';

  if (step.force) {
    command += ' -f';
  }

  if (typeof step.checkout === 'string') {
    command += ` ${ step.checkout }`;
  }

  const result = kraken.exec(command);

  return result;
}

module.exports = checkout;
