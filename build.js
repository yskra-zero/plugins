/* eslint-disable no-console */

import { exec } from 'node:child_process';
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
