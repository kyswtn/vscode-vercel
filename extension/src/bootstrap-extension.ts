import {AuthenticationStateProvider} from './authentication-state-provider'
import {ContextId} from './constants'
import {DeploymentStatusBarItem} from './deployment-status-bar-item'
import {DeploymentsStateProvider} from './deployments-state-provider'
import {ContextKeys, Injectable, type OnExtensionBootstrap} from './lib'
import {LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {LocalProjectsStateProvider} from './local-projects-state-provider'

@Injectable()
export class BootstrapExtension implements OnExtensionBootstrap {
  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly contextKeys: ContextKeys,
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
    private readonly localProjectsState: LocalProjectsStateProvider,
    private readonly deploymentStatusBarItem: DeploymentStatusBarItem,
  ) {}

  async onExtensionBootstrap() {
    await this.contextKeys.set(ContextId.IsReady, true, 'globalState')

    // It's important that these bootstrap functions don't emit events to prevent extra renders.
    // `onWillChange` events are an exception because they're required to show loading indicator.

    await Promise.all([
      // These two state can be loaded independently.
      this.authState.loadSessionOnBootstrap(),
      this.localProjectsState.loadLocalProjects(),
    ])

    await this.linkedProjectsState.linkLocalProjectsOnBootstrap()
    await this.deploymentsState.loadDeployments()
    await this.deploymentStatusBarItem.setInitialDisplayState()
  }
}
