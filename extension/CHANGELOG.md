# vscode-vercel

## 2.2.0

### Minor Changes

- 3e4c787: Fix bugs, refactor, and add a ton of features.

  - Fix CLI authentication on Windows
  - Fix user being logged out when there's no internet
  - Fix teamId being selected from user instead of project
  - Fix state related bugs and improve linking error messages
  - Tidy up hover views
  - Add deployment checks
  - Add auto-refresh for build logs
  - Add auto-refresh for deployments and deployment checks
  - Add workspace independent file views for deployment logs and outputs (e.g. open from recents, drag-and-drop files)
  - Add cmd+click links (both absolute and relative) in deployment logs and outputs
  - Add more deployment actions (promote, redeploy, rollback and view details)

## 2.1.4

### Patch Changes

- 6e476a6: Fix XDG data path for CLI config on Windows

## 2.1.3

### Patch Changes

- b01ca8b: Fix broken import and add authentication check on bootstrap

## 2.1.2

### Patch Changes

- bc7aa68: Fix accidentally enabled DEMO mode

## 2.1.1

### Patch Changes

- 0e03eac: Fix projects not being updated when settings changed

## 2.1.0

### Minor Changes

- 97adeed: Add `vercel.files.exclude` configuration to exclude projects from folders.

## 2.0.0

### Major Changes

- b426363: Overhaul and rewrite the entire thing as v2. The extension name would be the only thing left untouched.
