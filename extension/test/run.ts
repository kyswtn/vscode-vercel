import path from 'pathe'
import {runTests} from '@vscode/test-electron'

try {
  // The folder containing the Extension Manifest package.json
  // Passed to `--extensionDevelopmentPath`
  const extensionDevelopmentPath = path.resolve(__dirname, '../')

  // The path to the extension test script
  // Passed to --extensionTestsPath
  const extensionTestsPath = path.resolve(__dirname, './suite')

  await runTests({
    version: 'insiders',
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: ['--disable-extensions'],
  })
} catch (err) {
  console.error('Failed to run tests')
  process.exit(1)
}
