import fs from 'node:fs/promises'
import path from 'node:path'
import {$} from 'bun'

const parentDir = 'fonts'
const extension = '.woff2'

const fontsDir = path.join(__dirname, '../public', parentDir)
const fontFiles = await fs
  .readdir(fontsDir, {recursive: true})
  .then((files) => files.filter((f) => f.endsWith(extension)).map((f) => path.join(parentDir, f)))

const type = fontFiles.map((f) => `"/${f}"`).join('|')
const ts = `declare type AbsoluteFontFilePath = ${type}`
const dtsPath = path.join(__dirname, '../src/fonts.d.ts')
await fs.writeFile(dtsPath, ts, 'utf-8')

await $`biome format --write ${dtsPath}`
