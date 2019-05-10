'use strict';

async function reset(kraken, step) {
  let command = 'git reset';

  if (step.hard) {
    command += ' --hard';
  }

  if (typeof step.reset === 'string') {
    command += ` ${ step.reset }`;
  }

  const result = await kraken.exec(command);

  return result;
}

module.exports = reset;
