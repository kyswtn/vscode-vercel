import * as vscode from 'vscode'
import {ContextId, VercelDeploymentEnvironment, VercelDeploymentState} from './constants'
import {ContextKeys, Injectable} from './lib'
import {diffArrays} from './utils'

export type DeploymentFilters = {
  target: string[]
  status: string[]
}

export const defaultDeploymentFilters: DeploymentFilters = {
  target: [VercelDeploymentEnvironment.Production, VercelDeploymentEnvironment.Preview],
  status: [
    VercelDeploymentState.Queued,
    VercelDeploymentState.Building,
    VercelDeploymentState.Ready,
    VercelDeploymentState.Error,
  ],
}

@Injectable()
export class DeploymentFiltersStateProvider implements vscode.Disposable {
  private _filters: DeploymentFilters = defaultDeploymentFilters
  private readonly onDidChangeFiltersEventEmitter = new vscode.EventEmitter<void>()
  private readonly disposable: vscode.Disposable

  constructor(contextKeys: ContextKeys) {
    this.disposable = this.onDidChangeFilters(() => {
      const isDirty = this.hasStateChanged(defaultDeploymentFilters, this._filters)
      // TODO: Should I save filters in current workspace and restore them afterwards?
      void contextKeys.set(ContextId.DeploymentsFiltered, isDirty)
    })
  }

  dispose() {
    this.onDidChangeFiltersEventEmitter.dispose()
    this.disposable.dispose()
  }

  get searchParams() {
    const filtersState = this._filters
    const searchParams = new URLSearchParams()

    if (filtersState.target && filtersState.target.length !== 2) {
      // There are only two targets, length 2 means all are selected, no need to include params.
      searchParams.append('target', filtersState.target.join(','))
    }

    if (filtersState.status && filtersState.status.length !== 5) {
      // Same here with length 5.
      searchParams.append('state', filtersState.status.join(','))
    }

    return searchParams
  }

  get filters() {
    return this._filters
  }

  get onDidChangeFilters() {
    return this.onDidChangeFiltersEventEmitter.event
  }

  updateFilters(newFiltersState: DeploymentFilters) {
    const changed = this.hasStateChanged(this._filters, newFiltersState)
    if (!changed) return

    this._filters = newFiltersState
    this.onDidChangeFiltersEventEmitter.fire()
  }

  resetFilters() {
    this.updateFilters(defaultDeploymentFilters)
  }

  private hasStateChanged(left: DeploymentFilters, right: DeploymentFilters) {
    return !(diffArrays(left.status, right.status) === undefined && diffArrays(left.target, right.target) === undefined)
  }
}
