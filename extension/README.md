# VSCode Vercel

Enhance your Vercel deployment experience within Visual Studio Code. Monitor deployments, manage projects, and inspect deployment artifacts, all within your code editor.

<img align="center" src="https://raw.githubusercontent.com/kyswtn/vscode-vercel/main/.github/showcase.png" />

This extension complements, rather than replaces, the Vercel Dashboard and the [Official Vercel CLI](https://vercel.com/docs/cli). The purpose of this extension is not to replicate all the website's features but to offer actionable tools that developers can use within their code editor, reducing context switching and streamlining the Vercel development experience.

The extension integrates seamlessly with the Vercel CLI. Deployments are displayed based on available projects within a folder or workspace. Projects must be [linked](#manage-projects) first to be managed.

## Features

- [**Monitor Deployments**](#monitor-deployments) &mdash; Stay on top of deployments while coding through the deployments sidebar.
- [**Manage Projects**](#manage-projects) &mdash; Link new projects, pull environment variables, even in monorepos.
- [**Inspect Deployments**](#inspect-deployments) &mdash; Access deployment build logs and outputs, just like regular files.
- [**Seamless Authentication**](#seamless-authentication) &mdash; Multiple authentication options including OAuth, access tokens, or Vercel CLI.
- [**And more...**](#planned) &mdash; At-a-glance deployment info on status bar, `vercel.json` file validations, and more.

All these features are designed to work in all VSCode based editors such as VSCode Insiders, VSCodium, vscode.dev, and GitHub Codespaces.

### Monitor Deployments

Effortlessly monitor all your deployments through the deployment sidebar. This feature provides an organized list of deployments, displaying crucial information like status, timestamps, and URLs. Easily filter deployments to focus on what’s important, ensuring you have a clear view of your deployment history while coding.

> [!NOTE]  
> **Coming soon**: Real-time updates will ensure you never miss new deployments by your teammates.

### Manage Projects

The extension works seamlessly with the Vercel CLI. Easily link new projects and pull environment variables into a local `.env.local` file, all within the editor, without needing to use the CLI. Getting a Vercel project up and running has never been easier. These features are designed to work seamlessly, even in monorepos containing multiple Vercel projects.

💡 Right-click on a folder and select "Link to Vercel Project" to link it to a Vercel project. Or link the root directory to a project with the "Link Workspace to a Project" command.

### Inspect Deployments

Inspect deployment build logs and artifacts just like regular files. Build outputs can be browsed in a file tree within deployment details sidebar. All your favorite keybindings, editor features, and extensions are available for these files, including file icon themes, syntax highlighting, complex search queries, and VIM keybindings.

This ensures that troubleshooting deployments is just a click away, helping you maintain a smooth and efficient development cycle.

### Seamless Authentication

We support multiple methods for authenticating the extension. Vercel OAuth integration is recommended for its ease of use, but manually configured access tokens for more complex permissions are also accepted. If you've already signed in using the Vercel CLI, the extension can use existing access tokens, so you don't have to sign in again.

> [!NOTE]
> Certain features will be unavailable based on the authentication method chosen. For example, linking to projects from other teams is only possible if you authenticate using a custom access token or the Vercel CLI.

If you're a VSCode extension developer, you can also use the extension as a dependency to enable Vercel authentication within your extension.

### Planned

We have many more features planned, _potentially_ including

- **Real-time Updates** &mdash; Deployments sidebar, status bar item, logs, and file trees get updated in real-time with detailed progress as new deployments queue in.
- **More Deployment Actions** &mdash; Make it easier to perform actionable tasks such as re-deploying the latest deployment, promoting a deployment to production, rolling back to a previous deployment etc.
- **Deployment Checks** &mdash; View real-time check statuses of a deployment and it's details.
- **Better Git Support** &mdash; Ensure displayed deployments are aligned with the branch you're working on.
- **Notifications** &mdash; Set conditions to get notified when met, e.g. failed deployments within `main` branch.
- **Vercel CLI Command Palette** &mdash; A command palette to run Vercel CLI commands directly from within VSCode, without needing to switch to a shell.

## Demo

Here's a quick rapid-fire demo GIF of some of the features of this extension.

<img align="center" src="https://raw.githubusercontent.com/kyswtn/vscode-vercel/main/.github/demo.gif" />
