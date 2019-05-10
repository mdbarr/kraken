'use strict';

async function yarn(kraken, step) {
  if (step.install !== false) {
    kraken.exec('yarn install');
  }

  let command = `yarn ${ step.yarn }`;

  if (step.args) {
    command += ` ${ step.args }`;
  }

  const result = await kraken.exec(command);

  return result;
}

module.exports = yarn;
