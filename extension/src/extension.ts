import 'reflect-metadata/lite'
import * as vscode from 'vscode'
import {Extension} from './lib'
import {logAndShowErrorMessage} from './utils/errors'

import {AuthenticationStateProvider} from './authentication-state-provider'
import {BootstrapExtension} from './bootstrap-extension'
import {CustomFileSystemProvider} from './custom-file-system-provider'
import {CustomUriHandler} from './custom-uri-handler'
import {DeploymentChecksTreeDataProvider, DeploymentChecksTreeView} from './deployment-checks-tree'
import {DeploymentContentsStateProvider} from './deployment-contents-state-provider'
import {DeploymentFilesTreeDataProvider, DeploymentFilesTreeView} from './deployment-files-tree'
import {DeploymentFiltersStateProvider} from './deployment-filters-state-provider'
import {DeploymentStatusBarItem} from './deployment-status-bar-item'
import {DeploymentsStateProvider} from './deployments-state-provider'
import {DeploymentsTreeDataProvider, DeploymentsTreeView} from './deployments-tree'
import {ExtensionConfiguration} from './extension-configuration'
import {FileWatchersStateProvider} from './file-watchers-state-provider'
import {FoldersStateProvider} from './folders-state-provider'
import {LinkFolderToProjectCommand} from './link-folder-to-project-command'
import {LinkWorkspaceToProjectCommand} from './link-workspace-to-project-command'
import {LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {LocalProjectsStateProvider} from './local-projects-state-provider'
import {ProjectsStateProvider} from './projects-state-provider'
import {ProjectsTreeDataProvider, ProjectsTreeView} from './projects-tree'
import {PullEnvsCommand} from './pull-envs-command'
import {SaveOpenedFileCommand} from './save-opened-file-command'
import {SignInCommand} from './sign-in-command'
import {SignOutCommand} from './sign-out-command'
import {SwitchFocusedProjectCommand} from './switch-focused-project-command'
import {VercelApiClient} from './vercel-api-client'
import {VercelAuthenticationProvider} from './vercel-authentication-provider'
import {ViewFileDecorationProvider} from './view-file-decoration-provider'

const extension = new Extension({
  entries: [
    BootstrapExtension,
    // Shared
    VercelApiClient,
    CustomUriHandler,
    CustomFileSystemProvider,
    ViewFileDecorationProvider,
    SaveOpenedFileCommand,
    PullEnvsCommand,
    ExtensionConfiguration,
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
    // Deployment events
    DeploymentContentsStateProvider,
    // Deployment Files
    DeploymentFilesTreeDataProvider,
    DeploymentFilesTreeView,
    // Deployment Checks
    DeploymentChecksTreeDataProvider,
    DeploymentChecksTreeView,
  ],
})

// Uncomment this for DEMO mode with fake data.
// import {DemoVercelApiClient} from './demo/demo-vercel-api-client'
// extension.container.override(VercelApiClient, new DemoVercelApiClient())

export async function activate(context: vscode.ExtensionContext) {
  try {
    await extension.activate(context)
  } catch (error) {
    logAndShowErrorMessage(error, 'activate the extension')
  }
}
