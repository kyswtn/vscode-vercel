import 'reflect-metadata/lite'
import * as vscode from 'vscode'
import {Extension} from './lib'
import {logAndShowErrorMessage} from './utils/errors'

import {BootstrapExtension} from './bootstrap-extension'
import {LinkFolderToProjectCommand} from './commands/link-folder-to-project-command'
import {LinkWorkspaceToProjectCommand} from './commands/link-workspace-to-project-command'
import {PullEnvsCommand} from './commands/pull-envs-command'
import {SaveOpenedFileCommand} from './commands/save-opened-file-command'
import {SignInCommand} from './commands/sign-in-command'
import {SignOutCommand} from './commands/sign-out-command'
import {SwitchFocusedProjectCommand} from './commands/switch-focused-project-command'
import {CustomDocumentLinkProvider} from './shared/custom-document-link-provider'
import {CustomFileSystemProvider} from './shared/custom-file-system-provider'
import {CustomUriHandler} from './shared/custom-uri-handler'
import {DeploymentStatusBarItem} from './shared/deployment-status-bar-item'
import {VercelAuthenticationProvider} from './shared/vercel-authentication-provider'
import {ViewFileDecorationProvider} from './shared/view-file-decoration-provider'
import {AuthenticationStateProvider} from './state/authentication-state-provider'
import {DeploymentContentStateProvider} from './state/deployment-content-state-provider'
import {DeploymentFiltersStateProvider} from './state/deployment-filters-state-provider'
import {DeploymentsStateProvider} from './state/deployments-state-provider'
import {ExtensionConfigStateProvider} from './state/extension-config-state-provider'
import {FileWatchersStateProvider} from './state/file-watchers-state-provider'
import {FoldersStateProvider} from './state/folders-state-provider'
import {LinkedProjectsStateProvider} from './state/linked-projects-state-provider'
import {LocalProjectsStateProvider} from './state/local-projects-state-provider'
import {ProjectsStateProvider} from './state/projects-state-provider'
import {DeploymentChecksTreeDataProvider, DeploymentChecksTreeView} from './treeviews/deployment-checks-tree'
import {DeploymentFilesTreeDataProvider, DeploymentFilesTreeView} from './treeviews/deployment-files-tree'
import {DeploymentsTreeDataProvider, DeploymentsTreeView} from './treeviews/deployments-tree'
import {ProjectsTreeDataProvider, ProjectsTreeView} from './treeviews/projects-tree'
import {VercelApiClient} from './vercel-api-client'

const extension = new Extension({
  entries: [
    BootstrapExtension,
    // Shared
    CustomDocumentLinkProvider,
    CustomUriHandler,
    ExtensionConfigStateProvider,
    CustomFileSystemProvider,
    PullEnvsCommand,
    SaveOpenedFileCommand,
    VercelApiClient,
    ViewFileDecorationProvider,
    // Authentication
    VercelAuthenticationProvider,
    AuthenticationStateProvider,
    SignInCommand,
    SignOutCommand,
    // Projects
    FoldersStateProvider,
    FileWatchersStateProvider,
    LocalProjectsStateProvider,
    LinkedProjectsStateProvider,
    ProjectsStateProvider,
    ProjectsTreeDataProvider,
    ProjectsTreeView,
    SwitchFocusedProjectCommand,
    LinkFolderToProjectCommand,
    LinkWorkspaceToProjectCommand,
    // Deployments
    DeploymentsStateProvider,
    DeploymentFiltersStateProvider,
    DeploymentsTreeDataProvider,
    DeploymentsTreeView,
    DeploymentStatusBarItem,
    // Deployment Files
    DeploymentContentStateProvider,
    DeploymentFilesTreeDataProvider,
    DeploymentFilesTreeView,
    // Deployment Checks
    DeploymentChecksTreeDataProvider,
    DeploymentChecksTreeView,
  ],
})

// Uncomment this for DEMO mode with fake data.
// import {DemoVercelApiClient} from './_demo/demo-vercel-api-client'
// extension.container.override(VercelApiClient, new DemoVercelApiClient())

export async function activate(context: vscode.ExtensionContext) {
  try {
    await extension.activate(context)
  } catch (error) {
    logAndShowErrorMessage(error, 'activate the extension')
  }
}
