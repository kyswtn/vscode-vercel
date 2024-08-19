import * as vscode from 'vscode'
import {AuthenticationMethod} from '../constants'
import {showQuickPick} from './show-quickpick'

type AuthMethodQuickPickItem = vscode.QuickPickItem & {method?: AuthenticationMethod}

export async function showAuthenticationQuickPick() {
  const items: AuthMethodQuickPickItem[] = [
    {
      method: AuthenticationMethod.EnterAccessToken,
      label: 'Enter access token',
      detail: 'Enter an access token manually',
    },
    {
      method: AuthenticationMethod.StoredAccessToken,
      label: 'Stored access token',
      detail: 'Use access token stored by Vercel CLI',
    },
  ]

  // Vercel integrations can only have one redirect URI. Therefore only show OAuth option if
  // uriScheme matches REDIRECT_URI's scheme.
  const isOAuthAvailable = process.env.REDIRECT_URI.startsWith(vscode.env.uriScheme)
  if (isOAuthAvailable) {
    items.unshift(
      {
        kind: vscode.QuickPickItemKind.Separator,
        label: 'Recommended',
      },
      {
        method: AuthenticationMethod.OAuth,
        label: 'OAuth',
        detail: 'Open a webpage to sign in using Vercel OAuth',
      },
      {
        kind: vscode.QuickPickItemKind.Separator,
        label: '',
      },
    )
  }

  const picked = await showQuickPick({
    title: 'Vercel Authentication',
    placeholder: 'Choose a method to sign in',
    items,
  })

  return picked?.method
}
