import ms from 'ms'
import * as vscode from 'vscode'
import {
  CommandId,
  TreeItemContextValue,
  UriAuthority,
  VercelDeploymentState,
  fileSystemProviderScheme,
} from './constants'
import {Deployment} from './deployments-state-provider'
import type {CustomIcon, GitBranch, GitCommit} from './types'
import {capitalize, withMarkdownUrl} from './utils'

const deploymentStatusIcons = {
  INITIALIZING: 'issue-draft',
  READY: 'pass',
  ERROR: 'error',
  BUILDING: 'wrench',
  QUEUED: 'watch',
  CANCELED: 'close',
} satisfies Record<VercelDeploymentState, string>

const deploymentStatusColors = {
  INITIALIZING: 'testing.iconUnset',
  READY: 'testing.iconPassed',
  ERROR: 'testing.iconErrored',
  BUILDING: 'inputValidation.warningBorder',
  QUEUED: 'testing.iconQueued',
  CANCELED: 'testing.iconSkipped',
} satisfies Record<VercelDeploymentState, string>

export class DeploymentTreeItem extends vscode.TreeItem {
  override contextValue = TreeItemContextValue.Deployment

  constructor(public readonly deployment: Deployment) {
    super(deployment.data.name, vscode.TreeItemCollapsibleState.Collapsed)

    this.id = deployment.id
    this.resourceUri = vscode.Uri.parse(`vscode-vercel-view://deployments/${deployment.id}`)
    this.iconPath = this.getIcon()
    this.description = this.getDescription()
    this.tooltip = this.getTooltip()
  }

  private getIcon() {
    const readyState = this.deployment.data.state

    return new vscode.ThemeIcon(
      readyState ? deploymentStatusIcons[readyState] : ('custom-icons-blank' satisfies CustomIcon),
      new vscode.ThemeColor((readyState && deploymentStatusColors[readyState]) ?? deploymentStatusColors.CANCELED),
    )
  }

  private getDescription() {
    const {createdAt} = this.deployment.data
    return `${ms(new Date().getTime() - createdAt)} ago`
  }

  private getTooltip() {
    const tooltip = new vscode.MarkdownString('', true)
    const {data: deployment, branch, commit} = this.deployment

    if (deployment.state) {
      tooltip.appendMarkdown(
        `### $(info) ${capitalize(deployment.state)} on ${capitalize(deployment.target ?? 'preview')}`,
      )
    }

    if (deployment.ready) {
      tooltip.appendMarkdown(` (took ${ms(deployment.ready - deployment.createdAt)})\n\n`)
    }

    if (deployment.state || deployment.ready) {
      tooltip.appendMarkdown('\n---\n\n')
    }

    if (deployment.url) {
      tooltip.appendMarkdown(`$(globe) [${deployment.url}](https://${deployment.url})\n\n`)
    }

    if (commit) {
      tooltip.appendMarkdown(`$(git-commit) ${commit.message}\n\n`)
    }

    if (deployment.url || commit) {
      tooltip.appendMarkdown('---\n\n')
    }

    tooltip.appendText(`${ms(new Date().getTime() - deployment.createdAt)} ago`)

    if (branch) {
      tooltip.appendMarkdown(` from ${withMarkdownUrl(`$(git-branch) ${branch.name}`, branch.url)}`)
    }

    if (commit) {
      tooltip.appendText(` by ${commit.authorName}`)
    }

    return tooltip
  }
}

export class DeploymentBuildLogsItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('pulse')

  constructor(deploymentId: string, deploymentName: string, deploymentStatus?: string) {
    super('Build Logs', vscode.TreeItemCollapsibleState.None)
    this.description = deploymentStatus ?? ''

    this.command = {
      title: 'Build Logs',
      command: 'vscode.open',
      arguments: [`${fileSystemProviderScheme}://${UriAuthority.Deployments}/${deploymentId}/${deploymentName}.log`],
    }
  }
}

export class DeploymentOpenUrlItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('globe')

  constructor(url: string) {
    super('Visit', vscode.TreeItemCollapsibleState.None)
    this.description = url
    this.command = {
      title: 'Open Deployed URL',
      command: 'vscode.open',
      arguments: [`https://${url}`],
    }
  }
}

export class DeploymentGitBranchItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('git-branch')

  constructor(branch: GitBranch, repoRef?: string) {
    super(branch.name, vscode.TreeItemCollapsibleState.None)
    this.description = repoRef ?? false
    this.tooltip = 'Git Branch'
    this.command = {
      title: 'Open Git Branch URL',
      command: 'vscode.open',
      arguments: [branch.url],
    }
  }
}

export class DeploymentGitCommitItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('git-commit')

  constructor(commit: GitCommit) {
    super(commit.message ?? 'No commit message', vscode.TreeItemCollapsibleState.None)
    this.description = `${commit.authorName}`
    this.tooltip = 'Git Commit'
    this.command = {
      title: 'Open Git Commit URL',
      command: 'vscode.open',
      arguments: [commit.url],
    }
  }
}

export class DeploymentDetailsItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('indent')

  constructor(deploymentId: string) {
    super('View More', vscode.TreeItemCollapsibleState.None)
    this.command = {
      title: 'View More',
      command: CommandId.SetFocusedDeploymentId,
      arguments: [deploymentId],
    }
  }
}
