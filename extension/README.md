# VSCode Vercel

Enhance your Vercel deployment experience within Visual Studio Code. Monitor deployments, manage projects, and inspect deployment artifacts, all within your code editor.

<img align="center" src="https://raw.githubusercontent.com/kyswtn/vscode-vercel/main/.github/showcase.png" />

This extension complements, rather than replaces, the Vercel Dashboard and the [Official Vercel CLI](https://vercel.com/docs/cli). The purpose of this extension is not to replicate all the website's features but to offer actionable tools that developers can use within their code editor, reducing context switching and streamlining the Vercel development experience.

The extension integrates seamlessly with the Vercel CLI. Deployments are displayed based on available projects within a folder or workspace. Projects must be [linked](#manage-projects) first to be managed.

## Features

- [**Monitor Deployments**](#monitor-deployments) &mdash; Stay on top of deployments in real-time through the deployments sidebar.
- [**Manage Projects**](#manage-projects) &mdash; Link new projects, pull environment variables, even in monorepos.
- [**Inspect Deployments**](#inspect-deployments) &mdash; Access deployment build logs and outputs, just like regular files.
- [**Deployment Checks**](#inspect-deployments) &mdash; Keep an eye on your integrated deployment checks.
- [**Seamless Authentication**](#seamless-authentication) &mdash; Multiple authentication options including OAuth, access tokens, or Vercel CLI.
- [**And more...**](#more) &mdash; At-a-glance deployment info on status bar, `vercel.json` file validations, and more.

All these features are designed to work in all VSCode based editors such as VSCode Insiders, VSCodium, vscode.dev, and GitHub Codespaces.

### Monitor Deployments

Effortlessly monitor all your deployments through the deployment sidebar. This feature provides an organized list of deployments, displaying crucial information like status, timestamps, and URLs. Easily filter deployments to focus on what’s important, ensuring you have a clear view of your deployment history while coding.

> [!NOTE]  
> Automatically refreshed, real-time updates will ensure you never miss new deployments by your teammates.

### Manage Projects

The extension works seamlessly with the Vercel CLI. Easily link new projects and pull environment variables into a local `.env.local` file, all within the editor, without needing to use the CLI. Getting a Vercel project up and running has never been easier. These features are designed to work seamlessly, even in monorepos containing multiple Vercel projects.

💡 Right-click on a folder and select "Link to Vercel Project" to link it to a Vercel project. Or link the root directory to a project with the "Link Workspace to a Project" command.

### Inspect Deployments

Inspect deployment build logs and artifacts just like regular files. Build outputs can be browsed in a file tree within deployment details sidebar. All your favorite keybindings, editor features, and extensions are available for these files, including file icon themes, syntax highlighting, complex search queries, and VIM keybindings.

This ensures that troubleshooting deployments is just a click away, helping you maintain a smooth and efficient development cycle.

Once a deployment has been selected for inspection, deployment checks are available at a glance. This helps you make sure your web applications meet desired quality metrics, successfully run end-to-end tests.

### Seamless Authentication

We support multiple methods for authenticating the extension. Vercel OAuth integration is recommended for its ease of use, but manually configured access tokens for more complex permissions are also accepted. If you've already signed in using the Vercel CLI, the extension can use existing access tokens, so you don't have to sign in again.

> [!NOTE]
> Certain features will be unavailable based on the authentication method chosen. For example, linking to projects from other teams is only possible if you authenticate using a custom access token or the Vercel CLI.

If you're a VSCode extension developer, you can also use the extension as a dependency to enable Vercel authentication within your extension.

### More

We have many more features _potentially_ including

- **Vercel CLI Command Palette** &mdash; A command palette to run Vercel CLI commands directly from within VSCode, without needing to switch to a shell.

## Demo

Here's a quick rapid-fire demo GIF of some of the features of this extension.

<img align="center" src="https://raw.githubusercontent.com/kyswtn/vscode-vercel/main/.github/demo.gif" />
