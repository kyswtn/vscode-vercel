import ms from 'ms'
import * as vscode from 'vscode'
import {CustomIcon} from '../types'
import {VercelProject} from '../vercel-project'
import {showQuickPick} from './show-quickpick'

type VercelProjectToQuickPickItem = vscode.QuickPickItem & {
  project?: VercelProject
}

export async function showVercelProjectQuickPick(items: VercelProject[]) {
  const picked = await showQuickPick<VercelProjectToQuickPickItem>({
    items: items.map(vercelProjectToQuickPickItem),
  })

  return picked?.project
}

export function vercelProjectToQuickPickItem(project: VercelProject): VercelProjectToQuickPickItem {
  return {
    project,
    iconPath: new vscode.ThemeIcon('custom-icons-dashed-triangle' satisfies CustomIcon),
    label: project.name,
    description: [ms(project.latestUpdatedMsAgo), project.productionAlias].filter((item) => item).join(' · '),
  }
}
