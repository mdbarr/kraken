'use strict';

async function packager(kraken, step) {
  let command = 'tar -v -c';

  if (step.name.endsWith('gz')) {
    command += ' --gzip';
  } else if (step.name.endsWith('xz')) {
    command += ' --xz';
  } else if (step.name.endsWith('bz2')) {
    command += ' --bzip2';
  }

  command += ` -f ${ step.name } ${ step.package }`;

  const result = await kraken.exec(command);

  return result;
}

module.exports = packager;
