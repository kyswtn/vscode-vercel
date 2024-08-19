import ms from 'ms'
import path from 'pathe'
import * as vscode from 'vscode'
import {CommandId, TreeId, TreeItemContextValue, VercelDeploymentEnvironment, sourceProviderNames} from './constants'
import {Injectable} from './lib'
import {LinkedProject, LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {PullEnvsCommand} from './pull-envs-command'
import {CustomIcon} from './types'
import {truncateWithEllipsis, withMarkdownUrl} from './utils'

export class ProjectTreeItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('custom-icons-dashed-triangle' satisfies CustomIcon)
  override contextValue = TreeItemContextValue.Project

  constructor(public readonly project: LinkedProject) {
    super(project.remote.name, vscode.TreeItemCollapsibleState.None)

    this.id = project.local.id
    this.resourceUri = vscode.Uri.parse(`vscode-vercel-view://projects/${project.local.id}`)
    this.description = this.getDescription()
    this.tooltip = this.getTooltip()
  }

  private getDescription() {
    const uriPath = vscode.workspace.asRelativePath(this.project.local.uri)
    const relativePath = !path.isAbsolute(uriPath) ? uriPath : undefined
    const timeAgo = ms(this.project.remote.latestUpdatedMsAgo)

    return [relativePath, timeAgo].filter((item) => item).join(' · ')
  }

  private getTooltip() {
    const tooltip = new vscode.MarkdownString('', true)

    const {remote: project} = this.project
    const {provider, repo, branch, commit} = project.latestDeploymentMeta ?? {}

    tooltip.appendMarkdown(`### $(${this.iconPath.id}) ${project.name}\n\n---\n\n`)

    if (project.productionAlias) {
      tooltip.appendMarkdown(`$(globe) [${project.productionAlias}](https://${project.productionAlias})\n\n`)
    }

    if (commit) {
      const commitMessageLines = commit.message.trim().split('\n')
      commitMessageLines[0] = withMarkdownUrl(truncateWithEllipsis(commitMessageLines?.[0] ?? '', 50), commit.url)

      tooltip.appendMarkdown(`$(git-commit) ${commitMessageLines.join('\n')}\n\n`)
    }

    if (project.productionAlias || commit) {
      tooltip.appendMarkdown('---\n\n')
    }

    tooltip.appendText(`${ms(project.latestUpdatedMsAgo)} ago`)

    if (branch) {
      tooltip.appendMarkdown(` from ${withMarkdownUrl(`$(git-branch) ${branch.name}`, branch.url)}`)
    }

    if (provider) {
      tooltip.appendMarkdown(` via ${withMarkdownUrl(sourceProviderNames[provider], repo?.url)}`)
    }

    return tooltip
  }
}

@Injectable()
export class ProjectsTreeDataProvider implements vscode.TreeDataProvider<LinkedProject>, vscode.Disposable {
  private isLoading = false
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<undefined>()
  private readonly disposable: vscode.Disposable

  constructor(private readonly linkedProjectsState: LinkedProjectsStateProvider) {
    this.disposable = vscode.Disposable.from(
      linkedProjectsState.onWillChangeLinkedProjects(() => {
        this.refreshRoot()
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeTreeDataEventEmitter.dispose()
  }

  get onDidChangeTreeData() {
    return this.onDidChangeTreeDataEventEmitter.event
  }

  getTreeItem(project: LinkedProject) {
    return new ProjectTreeItem(project)
  }

  async getChildren() {
    try {
      this.isLoading = true
      await this.linkedProjectsState.loadingPromise
      return this.getSortedProjects()
    } finally {
      this.isLoading = false
    }
  }

  private refreshRoot() {
    if (this.isLoading) return
    this.onDidChangeTreeDataEventEmitter.fire(undefined)
  }

  private getSortedProjects() {
    // TODO: Add menu items to allow sorting the projects in tree view. Currently blocked by
    // https://github.com/microsoft/vscode/issues/109306.
    return this.linkedProjectsState.linkedProjects.sort((a, b) => {
      const A = a.local.uri.path
      const B = b.local.uri.path
      return A > B ? 1 : A < B ? -1 : 0
    })
  }
}

@Injectable()
export class ProjectsTreeView implements vscode.Disposable {
  private readonly title: string
  private readonly treeView: vscode.TreeView<LinkedProject>
  private readonly disposable: vscode.Disposable

  constructor(
    treeDataProvider: ProjectsTreeDataProvider,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
    private readonly pullEnvsCommand: PullEnvsCommand,
  ) {
    this.treeView = vscode.window.createTreeView(TreeId.Projects, {treeDataProvider})
    this.title = this.treeView.title ?? 'Projects'

    this.disposable = vscode.Disposable.from(
      // Commands related to project tree view.
      vscode.commands.registerCommand(CommandId.RefreshProjects, this.refreshProjects, this),
      vscode.commands.registerCommand(CommandId.PullProjectEnvs, this.pullProjectEnvs, this),
      vscode.commands.registerCommand(CommandId.PullProjectEnvsWithOptions, this.pullProjectEnvsWithOptions, this),
      vscode.commands.registerCommand(CommandId.OpenProjectOnVercel, this.openProjectOnVercel, this),
      vscode.commands.registerCommand(CommandId.CopyProjectUrl, this.copyProjectUrl, this),
      // Event subscriptions.
      this.linkedProjectsState.onWillChangeLinkedProjects(() => {
        void this.addProjectsCountToTitle()
      }),
    )
  }

  dispose() {
    this.treeView.dispose()
    this.disposable.dispose()
  }

  private refreshProjects() {
    this.linkedProjectsState.reloadProjects()
  }

  private async openProjectOnVercel(project: LinkedProject) {
    await vscode.env.openExternal(vscode.Uri.parse(project.remote.projectUrl))
  }

  private async copyProjectUrl(project: LinkedProject) {
    await vscode.env.clipboard.writeText(project.remote.projectUrl)
  }

  private async pullProjectEnvs(project: LinkedProject) {
    return this.pullEnvsCommand.run(project, VercelDeploymentEnvironment.Development)
  }

  private async pullProjectEnvsWithOptions(project: LinkedProject) {
    return this.pullEnvsCommand.run(project)
  }

  private async addProjectsCountToTitle() {
    await this.linkedProjectsState.loadingPromise

    const projectsCount = this.linkedProjectsState.linkedProjects.length
    this.treeView.title = `${this.title} ${projectsCount ? `(${projectsCount})` : ''}`.trim()
  }
}
