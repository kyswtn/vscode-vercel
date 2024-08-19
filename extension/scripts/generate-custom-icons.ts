import {$} from 'bun'
import packageJson from '../package.json'

const fontName = 'custom-icons'
const srcDir = `resources/${fontName}`
const tmpDir = 'dist/fantasticon'
const destDir = 'resources/fonts'
const jsonFilePath = `src/${fontName}.json`

// create required directories if they don't exist
await $`mkdir -p ${tmpDir} ${destDir}`

// generate font assets into `tmpDir`
const fantasticon =
  await $`bun run fantasticon ${srcDir} -o ${tmpDir} -n ${fontName} -p ${fontName}`
if (fantasticon.exitCode !== 0) {
  process.exit(1)
}

// copy font file
await $`cp ${tmpDir}/${fontName}.woff ${destDir}/${fontName}.woff`
const fontPath = `${destDir}/${fontName}.woff`

// copy font mapping json file
await $`cp ${tmpDir}/${fontName}.json ${jsonFilePath}`
await $`biome format --write ${jsonFilePath}`

// can remove `tmpDir` now
await $`rm -rf ${tmpDir}`

// make a backup of package.json before we modify it
await $`cp package.json package.json.bak`

// read that file immediately to write to package.json
const infoJson: Record<string, number> = await Bun.file(jsonFilePath).json()
const icons = Object.entries(infoJson).map(([key, value]) => [
  `${fontName}-${key}`,
  {
    description: key,
    default: {
      fontPath,
      fontCharacter: `\\${value.toString(16)}`,
    },
  },
])

packageJson.contributes.icons = Object.fromEntries(icons)
await Bun.write('package.json', JSON.stringify(packageJson))

// There's a bug where biome format script looks for rome.json and format incorrectly. Until that is
// fixed, package.json will be formatted manually.
// await $`biome format --write package.json`
