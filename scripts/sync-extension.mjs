import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.resolve(process.env.APPLE_QUEUE_EXTENSION_SOURCE || '/home/ubuntu/projects/apple-notes-extension');
const outputRoot = path.join(projectRoot, 'public', 'extension-template');
const files = [
  'manifest.json', 'background.js', 'popup.html', 'popup.js', 'editor.js',
  'settings.html', 'settings.js', 'marked.js', 'turndown.js',
  'icons/icon16.png', 'icons/icon48.png', 'icons/icon128.png',
];

await rm(outputRoot, { recursive: true, force: true });
for (const file of files) {
  const destination = path.join(outputRoot, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(sourceRoot, file), destination);
}

console.log(`Synced Apple Queue extension template from ${sourceRoot}`);
