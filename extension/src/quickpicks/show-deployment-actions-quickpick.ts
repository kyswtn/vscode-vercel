import ms from 'ms'
import path from 'pathe'
import * as vscode from 'vscode'
import {CommandId, FileSystemProviderScheme, sourceProviderNames} from '../constants'
import {VercelDeployment} from '../models/vercel-deployment'
import {showQuickPick} from './show-quickpick'

export const enum DeploymentQuickPickAction {
  OpenDeployedUrl = 1,
  OpenInVercelDashboard = 2,
  ViewBuildLogs = 3,
  ViewOutputFiles = 4,
  Promote = 5,
  Redeploy = 6,
  Rollback = 7,
  OpenGitCommit = 8,
  CopyLinkToGitCommit = 9,
  OpenGitBranch = 10,
  CopyLinkToGitBranch = 11,
  CopyDeployedUrl = 12,
  CopyDeploymentId = 13,
}
export type DeploymentActionsQuickPickItem = vscode.QuickPickItem & {action?: DeploymentQuickPickAction}

export async function showDeploymentActionsQuickPick(deployment: VercelDeployment) {
  const items: DeploymentActionsQuickPickItem[] = []

  if (deployment.url) {
    items.push({
      label: 'Open Deployed URL',
      description: `${deployment.project.name} · ${ms(deployment.project.lastUpdatedMsAgo)} ago`,
      detail: `$(globe) ${deployment.url}`,
      action: DeploymentQuickPickAction.OpenDeployedUrl,
    })
  }

  items.push(
    {
      label: 'Open in Vercel Dashboard',
      iconPath: new vscode.ThemeIcon('link'),
      action: DeploymentQuickPickAction.OpenInVercelDashboard,
    },
    {
      label: 'View Build Logs',
      iconPath: new vscode.ThemeIcon('pulse'),
      action: DeploymentQuickPickAction.ViewBuildLogs,
    },
  )

  if (deployment.url) {
    items.push({
      label: 'View Output Files',
      iconPath: new vscode.ThemeIcon('files'),
      action: DeploymentQuickPickAction.ViewOutputFiles,
    })
  }

  items.push(
    {
      kind: vscode.QuickPickItemKind.Separator,
      label: 'Actions',
    },
    {
      label: 'Promote This Deployment',
      action: DeploymentQuickPickAction.Promote,
    },
    {
      label: 'Redeploy This Deployment',
      action: DeploymentQuickPickAction.Redeploy,
    },
    {
      label: 'Rollback to This Deployment',
      action: DeploymentQuickPickAction.Rollback,
    },
  )

  const sourceProvider = sourceProviderNames[deployment.sourceProvider!] ?? 'Git'
  if (deployment.commit || deployment.branch) {
    items.push({
      kind: vscode.QuickPickItemKind.Separator,
      label: sourceProvider,
    })
  }

  if (deployment.commit) {
    items.push(
      {
        label: `Open Commit on ${sourceProvider}`,
        action: DeploymentQuickPickAction.OpenGitCommit,
      },
      {
        label: `Copy Link to Commit on ${sourceProvider}`,
        action: DeploymentQuickPickAction.CopyLinkToGitCommit,
      },
    )
  }

  if (deployment.branch) {
    items.push(
      {
        label: `Open Branch on ${sourceProvider}`,
        action: DeploymentQuickPickAction.OpenGitBranch,
      },
      {
        label: `Copy Link to Branch on ${sourceProvider}`,
        action: DeploymentQuickPickAction.CopyLinkToGitBranch,
      },
    )
  }

  items.push({
    kind: vscode.QuickPickItemKind.Separator,
    label: 'Copy',
  })

  if (deployment.url) {
    items.push({
      label: 'Copy Deployed URL',
      iconPath: new vscode.ThemeIcon('copy'),
      action: DeploymentQuickPickAction.CopyDeployedUrl,
    })
  }

  items.push({
    label: 'Copy Deployment Id',
    iconPath: new vscode.ThemeIcon('copy'),
  })

  const picked = await showQuickPick<DeploymentActionsQuickPickItem>({
    title: 'Deployment Actions',
    placeholder: 'Choose an action...',
    items,
  })

  const action = picked?.action
  if (!action) return

  switch (action as DeploymentQuickPickAction) {
    case DeploymentQuickPickAction.OpenDeployedUrl: {
      if (deployment.url) await vscode.env.openExternal(vscode.Uri.parse(`https://${deployment.url}`))
      break
    }
    case DeploymentQuickPickAction.OpenInVercelDashboard: {
      await vscode.env.openExternal(vscode.Uri.parse(path.join(deployment.project.url, deployment.id)))
      break
    }
    case DeploymentQuickPickAction.ViewBuildLogs: {
      await vscode.workspace.openTextDocument(
        vscode.Uri.parse(`${FileSystemProviderScheme.Files}://${deployment.authority}/${deployment.name}.log`),
      )
      break
    }
    case DeploymentQuickPickAction.ViewOutputFiles: {
      await vscode.commands.executeCommand(
        CommandId.SelectDeploymentForFiles,
        deployment.id,
        deployment.project.id,
        deployment.project.teamId,
      )
      break
    }
    case DeploymentQuickPickAction.OpenGitCommit: {
      if (deployment.commit?.url) await vscode.env.openExternal(vscode.Uri.parse(deployment.commit.url))
      break
    }
    case DeploymentQuickPickAction.CopyLinkToGitCommit: {
      if (deployment.commit?.url) await vscode.env.clipboard.writeText(deployment.commit.url)
      break
    }
    case DeploymentQuickPickAction.OpenGitBranch: {
      if (deployment.branch?.url) await vscode.env.openExternal(vscode.Uri.parse(deployment.branch.url))
      break
    }
    case DeploymentQuickPickAction.CopyLinkToGitBranch: {
      if (deployment.branch?.url) await vscode.env.clipboard.writeText(deployment.branch.url)
      break
    }
    case DeploymentQuickPickAction.CopyDeployedUrl: {
      await vscode.env.clipboard.writeText(deployment.url!)
      break
    }
    case DeploymentQuickPickAction.CopyDeploymentId: {
      await vscode.env.clipboard.writeText(deployment.id)
      break
    }
    default:
      return action
  }

  return
}
