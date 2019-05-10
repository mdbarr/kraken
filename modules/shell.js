'use strict';

async function shell(kraken, step) {
  const command = step.shell;

  const options = {};

  if (step.environment) {
    options.env = step.environment;
  }
  if (step.interpreter) {
    options.shell = step.interpreter;
  } else {
    options.shell = '/bin/bash';
  }
  if (step.input) {
    options.input = step.input;
  }
  const timeout = parseInt(step.timeout, 10);
  if (timeout) {
    options.timeout = timeout;
  }
  if (step.encoding) {
    options.encoding = step.encoding;
  }

  const result = await kraken.exec(command, options);

  if (step.variable) {
    kraken.environment[step.variable] = result.trim();
  }

  return result;
}

module.exports = shell;
