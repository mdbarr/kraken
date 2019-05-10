'use strict';

async function tag(kraken, step) {
  let command = `git tag ${ step.tag }`;

  if (step.message) {
    command += ` -m "${ step.message }"`;
  }

  let result = await kraken.exec(command);

  if (tag.push) {
    command = `git push origin ${ step.tag }`;
    result += await kraken.exec(command);
  }

  return result;
}

module.exports = tag;
