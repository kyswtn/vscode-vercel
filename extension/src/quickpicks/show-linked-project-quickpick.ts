import ms from 'ms'
import path from 'pathe'
import * as vscode from 'vscode'
import {LinkedProject} from '../models/linked-project'
import {CustomIcon} from '../types'
import {showQuickPick} from './show-quickpick'

type LinkedProjectQuickPickItem = vscode.QuickPickItem & {
  project?: LinkedProject
}

export async function showLinkedProjectQuickPick(items: LinkedProject[]) {
  const picked = await showQuickPick<LinkedProjectQuickPickItem>({
    items: items.map(linkedProjectToQuickPickItem),
  })

  return picked?.project
}

function linkedProjectToQuickPickItem(project: LinkedProject): LinkedProjectQuickPickItem {
  const uriPath = vscode.workspace.asRelativePath(project.local.uri)
  const relativePath = !path.isAbsolute(uriPath) ? uriPath : undefined

  return {
    project,
    iconPath: new vscode.ThemeIcon('custom-icons-dashed-triangle' satisfies CustomIcon),
    label: project.remote.name,
    description: [relativePath, ms(project.remote.lastUpdatedMsAgo)].filter((item) => item).join(' · '),
  }
}
