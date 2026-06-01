import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const indexPath = join(distDir, 'index.html');
const notFoundPath = join(distDir, '404.html');
const noJekyllPath = join(distDir, '.nojekyll');

const html = await readFile(indexPath, 'utf8');
const pagesHtml = html
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./');

await writeFile(indexPath, pagesHtml);
await copyFile(indexPath, notFoundPath);
await writeFile(noJekyllPath, '');
