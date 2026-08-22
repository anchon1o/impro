import { transform } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function load(url, context, next) {
  if (url.endsWith('.jsx')) {
    const src = await readFile(fileURLToPath(url), 'utf8');
    const out = await transform(src, { loader: 'jsx', format: 'esm', target: 'node18', jsx: 'automatic' });
    return { format: 'module', source: out.code, shortCircuit: true };
  }
  return next(url, context);
}
