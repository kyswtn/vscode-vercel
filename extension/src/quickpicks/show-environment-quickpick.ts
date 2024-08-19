import * as vscode from 'vscode'
import {VercelDeploymentEnvironment} from '../constants'
import {showQuickPick} from './show-quickpick'

type EnvironmentQuickPickItem = vscode.QuickPickItem & {environment?: VercelDeploymentEnvironment}

export async function showEnvironmentQuickPick() {
  const picked = await showQuickPick<EnvironmentQuickPickItem>({
    items: [
      {
        kind: vscode.QuickPickItemKind.Separator,
        label: 'Suggested',
      },
      {
        label: 'Development',
        environment: VercelDeploymentEnvironment.Development,
      },
      {
        kind: vscode.QuickPickItemKind.Separator,
        label: '',
      },
      {
        label: 'Preview',
        environment: VercelDeploymentEnvironment.Preview,
      },
      {
        label: 'Production',
        environment: VercelDeploymentEnvironment.Production,
      },
    ],
  })
  return picked?.environment
}
