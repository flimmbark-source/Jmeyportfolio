import { existsSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gameRoot = join(repoRoot, 'games', 'get-to-the-cafe')
const outputDir = join(repoRoot, 'public', 'games', 'get-to-the-cafe')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const viteBin = join(gameRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite')

if (!existsSync(join(gameRoot, 'package.json'))) process.exit(0)
if (!existsSync(viteBin)) {
  const install = spawnSync(npm, ['ci', '--prefix', gameRoot, '--no-audit', '--no-fund'], { cwd: repoRoot, stdio: 'inherit' })
  if (install.status !== 0) process.exit(install.status ?? 1)
}
rmSync(outputDir, { recursive: true, force: true })
const build = spawnSync(npm, ['run', 'build', '--prefix', gameRoot, '--', '--outDir', outputDir, '--emptyOutDir'], { cwd: repoRoot, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)
