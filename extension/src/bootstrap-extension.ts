import * as vscode from 'vscode'
import {ContextId} from './constants'
import {ContextKeys, Injectable, type OnExtensionBootstrap} from './lib'
import {DeploymentStatusBarItem} from './shared/deployment-status-bar-item'
import {AuthenticationStateProvider} from './state/authentication-state-provider'
import {DeploymentsStateProvider} from './state/deployments-state-provider'
import {LinkedProjectsStateProvider} from './state/linked-projects-state-provider'
import {LocalProjectsStateProvider} from './state/local-projects-state-provider'
import {ProjectsStateProvider} from './state/projects-state-provider'

@Injectable()
export class BootstrapExtension implements OnExtensionBootstrap, vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly contextKeys: ContextKeys,
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly localProjectsState: LocalProjectsStateProvider,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
    private readonly projectState: ProjectsStateProvider,
    private readonly deploymentStatusBarItem: DeploymentStatusBarItem,
  ) {
    this.disposable = vscode.Disposable.from(
      authState.onDidChangeCurrentSession(() => {
        void this.loadProjectsAndDeployments()
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
  }

  async onExtensionBootstrap() {
    // It's important that these bootstrap functions don't emit events to prevent extra renders.
    // `onWillChange` events are an exception because they're required to show loading indicator.

    try {
      await Promise.all([
        // These two state can be loaded independently.
        this.authState.loadSessionOnBootstrap(),
        this.localProjectsState.loadLocalProjectsWithoutEvents(),
      ])

      await this.loadProjectsAndDeployments()
      void this.authState.checkIfAuthenticationIsStillValid()
    } finally {
      await this.contextKeys.set(ContextId.IsReady, true)
    }
  }

  private async loadProjectsAndDeployments() {
    await this.linkedProjectsState.linkLocalProjectsOnBootstrap()
    this.projectState.loadProjectsOnBootstrap()
    await this.deploymentsState.loadDeployments()
    this.deploymentStatusBarItem.setInitialDisplayState()
  }
}
