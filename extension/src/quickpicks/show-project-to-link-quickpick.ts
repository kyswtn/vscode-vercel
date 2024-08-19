import * as vscode from 'vscode'
import {PlainVercelProject} from '../types'
import {showQuickPick} from './show-quickpick'
import {VercelProject} from '../vercel-project'
import {vercelProjectToQuickPickItem} from './show-vercel-project-quickpick'

type ProjectToLinkQuickPickItem = vscode.QuickPickItem & {
  project?: VercelProject
}

type LoadProjectsResponse = [
  /* suggested */ PlainVercelProject | undefined,
  /* all projects (including suggested) */ PlainVercelProject[],
]

function projectToQuickPickItem(_project: PlainVercelProject): ProjectToLinkQuickPickItem {
  const project = new VercelProject(_project)
  return vercelProjectToQuickPickItem(project)
}

export async function showProjectToLinkQuickPickItem(loadProjects: () => Promise<LoadProjectsResponse>) {
  const picked = await showQuickPick<ProjectToLinkQuickPickItem>({
    label: 'projects',
    async items() {
      let [suggested, projects] = await loadProjects()
      let items: ProjectToLinkQuickPickItem[] = []

      if (suggested) {
        projects = projects.filter((project) => project.id !== suggested.id)
        items = [
          {
            label: 'Suggested',
            kind: vscode.QuickPickItemKind.Separator,
          },
          projectToQuickPickItem(suggested),
          {
            label: '',
            kind: vscode.QuickPickItemKind.Separator,
          },
        ]
      }

      return items.concat(projects.map(projectToQuickPickItem))
    },
  })

  return picked?.project
}
