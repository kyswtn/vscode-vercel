import * as vscode from 'vscode'
import {CustomIcon} from '../types'

type ShowQuickPickOptions<
  T extends vscode.QuickPickItem,
  K extends boolean | undefined,
> = ShowQuickPickItemOptions<T> & {
  /**
   * The caller is expected to dispose the quickpick themselves.
   */
  quickpick?: vscode.QuickPick<T>

  title?: string
  placeholder?: string
  canSelectMany?: K
}

type ShowQuickPickItemOptions<T extends vscode.QuickPickItem> =
  | {
      items: readonly T[]
    }
  | {
      /**
       * To show `Loading ${label}...` when loading items.
       */
      label: string
      items: () => Promise<readonly T[]>
    }

export async function showQuickPick<
  T extends vscode.QuickPickItem,
  K extends boolean | undefined = undefined,
  R = K extends false | undefined ? T : T[],
>(options: ShowQuickPickOptions<T, K>): Promise<R | undefined> {
  // SAFETY: We'll reduce the type to LCD state so we can add loading states without type errors.
  const quickpick: vscode.QuickPick<vscode.QuickPickItem> = options.quickpick ?? vscode.window.createQuickPick()
  const disposables: vscode.Disposable[] = options.quickpick ? [] : [quickpick]

  if (options.title) quickpick.title = options.title
  if (options.placeholder) quickpick.placeholder = options.placeholder
  if (options.canSelectMany) quickpick.canSelectMany = options.canSelectMany

  quickpick.show()

  let items: readonly vscode.QuickPickItem[] | undefined
  if ('label' in options) {
    const label = options.label
    quickpick.items = [
      {
        iconPath: new vscode.ThemeIcon('custom-icons-blank' satisfies CustomIcon),
        label: `Loading ${label}...`,
      },
    ]

    try {
      items = await options.items()
    } catch (error) {
      let message: string
      if (error instanceof Error) {
        message = `Error while loading ${label}. ${error.message}`
      } else {
        message = `Unknown error while loading ${label}.`
      }
      quickpick.items = [
        {
          iconPath: new vscode.ThemeIcon('error'),
          label: message,
        },
      ]
      return
    }

    if (items === undefined) {
      quickpick.items = [
        {
          iconPath: new vscode.ThemeIcon('error'),
          label: `No ${label} were found.`,
        },
      ]
      return
    }
  } else {
    items = options.items
  }

  quickpick.items = items
  if (options.canSelectMany) {
    quickpick.selectedItems = quickpick.items.filter((item) => item.picked)
  }

  return new Promise<R | undefined>((resolve) => {
    let accepted: R | undefined
    disposables.push(
      quickpick.onDidAccept(() => {
        accepted = (options.canSelectMany ? quickpick.selectedItems : quickpick.activeItems[0]) as R | undefined
        quickpick.hide()
      }),
      quickpick.onDidHide(() => {
        resolve(accepted)
      }),
    )
  }).finally(() => {
    vscode.Disposable.from(...disposables).dispose()
  })
}
