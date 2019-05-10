'use strict';
const inquirer = require('inquirer');

async function prompt(kraken, step) {
  const result = await inquirer.prompt(step.prompt);
  console.pp(result);
  return result;
}

module.exports = prompt;
