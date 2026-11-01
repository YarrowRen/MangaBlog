import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['index.html','article.html','styles.css','app.js','layout.js','geometry.js']) await copyFile(file, `dist/${file}`);
await cp('assets', 'dist/assets', { recursive: true });
await copyFile('.nojekyll', 'dist/.nojekyll');
console.log('Static site built in dist/');
