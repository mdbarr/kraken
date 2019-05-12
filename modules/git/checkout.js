'use strict';

async function checkout(kraken, step) {
  let command = 'git checkout';

  if (step.force) {
    command += ' -f';
  }

  if (typeof step.git_checkout === 'string') {
    command += ` ${ step.checkout }`;
  }

  const result = await kraken.exec(command);

  return result;
}

module.exports = checkout;
