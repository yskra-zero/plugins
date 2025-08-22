/* eslint-disable no-console */

import { exec } from 'node:child_process';
import { copyFile } from 'node:fs';
import { glob } from 'glob';

glob('**/**/manifest.json')
  .then((files) => files
    .map((file) => file.replace('manifest.json', ''))
    .map((target) => exec(`TARGET=${target} pnpx vite build`, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    })),
  );

copyFile('./repo.json', 'dist/repo.json', (err) => {
  if (err) {
    throw err;
  }
  console.log('dist/repo.json');
});
