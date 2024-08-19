export const extensionPrefix = 'vercel'

export const fileSystemProviderScheme = 'vscode-vercel'
export const enum UriAuthority {
  Deployments = 'deployments',
}
export const enum DeploymentFileAccessType {
  Events = 'events',
  Files = 'files',
}

export const enum ContextId {
  IsReady = 'vercel:isReady',
  IsAuthenticated = 'vercel:isAuthenticated',
  NoProjectsFound = 'vercel:noProjectsFound',
  DeploymentsFiltered = 'vercel:deploymentsFiltered',
  FocusedProjectId = 'vercel:focusedProjectId',
  FocusedDeploymentId = 'vercel:focusedDeploymentId',
}

export const enum CommandId {
  // Authentication
  SignIn = 'vercel.signIn',
  SignOut = 'vercel.signOut',
  // Shared
  SwitchFocusedProject = 'vercel.switchFocusedProject',
  LinkWorkspaceToProject = 'vercel.linkWorkspaceToProject',
  LinkFolderToProject = 'vercel.linkFolderToProject',
  PullEnvs = 'vercel.pullEnvs',
  SaveOpenedFile = 'vercel.saveOpenedFile',
  // Projects
  RefreshProjects = 'vercel.projects.refresh',
  OpenProjectOnVercel = 'vercel.projects.openOnVercel',
  CopyProjectUrl = 'vercel.projects.copyUrl',
  PullProjectEnvs = 'vercel.projects.pullEnvs',
  PullProjectEnvsWithOptions = 'vercel.projects.pullEnvsWithOptions',
  // Deployments
  RefreshDeployments = 'vercel.deployments.refresh',
  FilterDeployments = 'vercel.deployments.filter',
  ResetFilters = 'vercel.deployments.resetFilters',
  FilterDeploymentsFilled = 'vercel.deployments.filterFilled',
  // Deployment Files
  RefreshDeploymentFiles = 'vercel.deploymentFiles.refresh',
  SetFocusedDeploymentId = 'vercel:setFocusedDeploymentId',
}

export const enum TreeId {
  Deployments = 'vercel-deployments',
  Projects = 'vercel-projects',
  DeploymentFiles = 'vercel-deployment-files',
  DeploymentChecks = 'vercel-deployment-checks',
}

export const enum TreeItemContextValue {
  Project = 'vercel:project',
  Deployment = 'vercel:deployment',
  DeploymentFile = 'vercel:deploymentFile',
}

export const enum FilePattern {
  ProjectJson = '**/.vercel/project.json',
  DotVercelDirectory = '**/.vercel/',
}

export const enum AuthenticationMethod {
  OAuth = 'oauth',
  EnterAccessToken = 'enter-access-token',
  StoredAccessToken = 'stored-access-token',
}

export const projectJsonPath = '.vercel/project.json'

export const envFileName = '.env.local'

export const noCommitMessage = 'No commit message'

export const sourceProviderNames = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'BitBucket',
}

export const enum VercelDeploymentState {
  Initializing = 'INITIALIZING',
  Building = 'BUILDING',
  Error = 'ERROR',
  Queued = 'QUEUED',
  Ready = 'READY',
  Canceled = 'CANCELED',
}

export const enum VercelDeploymentEnvironment {
  Development = 'development',
  Production = 'production',
  Preview = 'preview',
}
