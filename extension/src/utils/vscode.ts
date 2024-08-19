import * as vscode from 'vscode'

/**
 * Reads a json file and return serialized JSON, or undefined if JSON is invalid.
 */
export async function readJsonFile(file: vscode.Uri): Promise<unknown | undefined> {
  const json = await vscode.workspace.fs
    .readFile(file)
    .then((buffer) => Buffer.from(buffer).toString('utf-8'))
    .then((string) => {
      try {
        return JSON.parse(string)
      } catch (_) {
        return
      }
    })
  return json
}

export async function writeFile(file: vscode.Uri, content: string | Buffer): Promise<void> {
  const buffer = content instanceof Buffer ? content : Buffer.from(content, 'utf-8')
  await vscode.workspace.fs.writeFile(file, buffer)
}

export async function fileExists(file: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(file)
    return true
  } catch (_) {
    return false
  }
}
