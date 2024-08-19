import * as vscode from 'vscode'
import {CustomIcon, VercelTeam} from '../types'
import {showQuickPick} from './show-quickpick'

type TeamQuickPickItem = vscode.QuickPickItem & {
  teamId?: string
}

export async function showTeamQuickPick(loadTeams: () => Promise<VercelTeam[]>) {
  const picked = await showQuickPick({
    label: 'teams',
    async items() {
      const teams = await loadTeams()
      return teams.map(teamToQuickPickItem)
    },
  })
  return picked?.teamId
}

function teamToQuickPickItem(team: VercelTeam): TeamQuickPickItem {
  return {
    teamId: team.id,
    iconPath: new vscode.ThemeIcon('custom-icons-dashed-triangle' satisfies CustomIcon),
    label: team.name,
  }
}
