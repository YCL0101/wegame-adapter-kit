import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')
const sourcePath = path.join(packageRoot, 'README.md')
const distDir = path.join(packageRoot, 'dist')
const targetPath = path.join(distDir, 'README.md')

await mkdir(distDir, { recursive: true })
await copyFile(sourcePath, targetPath)

console.log(`Copied README to ${targetPath}`)
