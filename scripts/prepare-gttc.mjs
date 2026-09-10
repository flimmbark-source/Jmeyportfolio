import { cp, mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(process.cwd());
const sourceZip = join(repoRoot, 'games', 'get-to-the-cafe', 'Sprimbo.zip');
const outputDir = join(repoRoot, 'public', 'games', 'get-to-the-cafe');

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findIndexHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase() === 'index.html') {
      return join(dir, entry.name);
    }
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const found = await findIndexHtml(join(dir, entry.name));
    if (found) return found;
  }
  return null;
}

if (!(await exists(sourceZip))) {
  console.warn('[gttc] Sprimbo.zip not found; skipping local game preparation.');
  process.exit(0);
}

const tempDir = await mkdtemp(join(tmpdir(), 'gttc-'));

try {
  const result = spawnSync('unzip', ['-oq', sourceZip, '-d', tempDir], {
    stdio: 'inherit',
  });

  if (result.error) {
    throw new Error(`Could not run unzip: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`unzip exited with status ${result.status}`);
  }

  const indexPath = await findIndexHtml(tempDir);
  if (!indexPath) {
    throw new Error('Sprimbo.zip does not contain an index.html entry point.');
  }

  const gameRoot = dirname(indexPath);
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await cp(gameRoot, outputDir, { recursive: true });

  console.log(`[gttc] Browser build prepared at ${outputDir}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
