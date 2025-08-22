/* eslint-disable no-console */

import { exec } from 'node:child_process';
import { copyFile } from 'node:fs';
import { promisify } from 'node:util';
import { glob } from 'glob';

const execAsync = promisify(exec);

// eslint-disable-next-line antfu/no-top-level-await
await glob('**/**/manifest.json')
  .then((files) => Promise.all(files
    .map((file) => file.replace('manifest.json', ''))
    .map((target) =>
      execAsync(`TARGET=${target} pnpx vite build`)
        .then(({ stdout, stderr }) => {
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
        })
        .catch((err) => {
          console.error(err);
        }),
    )),
  );

copyFile('repo.json', 'dist/repo.json', (err) => {
  if (err) {
    throw err;
  }
  console.log('dist/repo.json');
});
