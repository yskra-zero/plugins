/* eslint-disable no-console */

import { exec } from 'node:child_process';
import { copyFile, readdir, writeFile } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { glob } from 'glob';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

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

readdir(resolve(__dirname, 'dist'), (err, files) => {
  if (err) {
    console.error(err);
    return;
  }

  const links = files
    .map((f) => `<li><a href="./${f}">${f}</a></li>`)
    .join('\n');

  const html = `
    <!DOCTYPE html>
    <html lang="">
    <head><meta charset="UTF-8" /><title>Yskra plugins</title></head>
    <body style="display: flex;flex-direction: column;align-items: center;justify-content: center;">
    <h1>Yskra plugins</h1>
    <ul>${links}</ul>
    </body>
    </html>
  `;

  writeFile('dist/index.html', html, (writeErr) => {
    if (writeErr) {
      console.error(writeErr);
    }
    else {
      console.log('dist/index.html');
    }
  });
});
