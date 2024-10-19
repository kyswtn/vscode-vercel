import * as vscode from 'vscode'
import {VercelDeploymentEnvironment, VercelDeploymentState} from '../constants'
import {DeploymentFilters, defaultDeploymentFilters} from '../state/deployment-filters-state-provider'
import {showQuickPick} from './show-quickpick'

type DeploymentFilterQuickPickItem = vscode.QuickPickItem & {
  type?: keyof DeploymentFilters
  value?: string
}

export async function showDeploymentFiltersQuickPick(filters: DeploymentFilters) {
  const quickpick = vscode.window.createQuickPick()
  quickpick.buttons = [
    {
      iconPath: new vscode.ThemeIcon('discard'),
      tooltip: 'Reset filters',
    },
  ]
  const buttonEventListener = quickpick.onDidTriggerButton(() => {
    const quickPickItems = getQuickPickItemsFromFilters(defaultDeploymentFilters)
    quickpick.items = quickPickItems
    quickpick.selectedItems = quickPickItems.filter((item) => item.picked)
  })

  const selectedItems = await showQuickPick({
    quickpick,

    canSelectMany: true,
    title: 'Filter deployments',
    items: getQuickPickItemsFromFilters(filters),
  }).finally(() => {
    buttonEventListener.dispose()
    quickpick.dispose()
  })

  if (selectedItems === undefined) return
  return getFiltersFromQuickPickItems(selectedItems)
}

function getQuickPickItemsFromFilters(state: DeploymentFilters) {
  const items: DeploymentFilterQuickPickItem[] = [
    {
      label: 'Environment',
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      type: 'target',
      label: 'Production',
      value: VercelDeploymentEnvironment.Production,
    },
    {
      type: 'target',
      label: 'Preview',
      value: VercelDeploymentEnvironment.Preview,
    },
    {
      label: 'Status',
      kind: vscode.QuickPickItemKind.Separator,
    },
    {
      type: 'status',
      label: 'Ready',
      value: VercelDeploymentState.Ready,
    },
    {
      type: 'status',
      label: 'Error',
      value: VercelDeploymentState.Error,
    },
    {
      type: 'status',
      label: 'Building',
      value: VercelDeploymentState.Building,
    },
    {
      type: 'status',
      label: 'Queued',
      value: VercelDeploymentState.Queued,
    },
    {
      type: 'status',
      label: 'Canceled',
      value: VercelDeploymentState.Canceled,
    },
  ]

  for (const item of items) {
    if (!item.value) continue

    item.picked =
      (item.type === 'status' && state.status.includes(item.value)) ||
      (item.type === 'target' && state.target.includes(item.value))
  }

  return items
}

function getFiltersFromQuickPickItems(items: readonly DeploymentFilterQuickPickItem[]) {
  const state: DeploymentFilters = {
    status: [],
    target: [],
  }

  for (const item of items) {
    if (!item.value) continue

    if (item.type === 'status') {
      state.status.push(item.value)
    } else if (item.type === 'target') {
      state.target.push(item.value)
    }
  }

  return state
}
