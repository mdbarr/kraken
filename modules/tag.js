'use strict';

function tag(kraken, step) {
  let command = `git tag ${ step.tag }`;

  if (step.message) {
    command += ` -m "${ step.message }"`;
  }

  let result = kraken.exec(command);

  if (tag.push) {
    command = `git push origin ${ step.tag }`;
    result += kraken.exec(command);
  }

  return result;
}

module.exports = tag;
