import {VercelDeploymentState} from '../constants'
import {PlainVercelDeploymentListed, PlainVercelProject, VercelDeploymentEvent, VercelFile} from '../types'

const today = new Date()
const minsAgo = (m: number) => new Date(new Date().setMinutes(today.getMinutes() - m)).getTime()
const daysAgo = (d: number) => new Date(new Date().setDate(today.getDate() - d)).getTime()

export default {
  accessToken: 'demo-access-token',
  user: {
    id: 'demo-user-id',
    username: 'joshua',
    version: 'northstar' as const,
    defaultTeamId: 'joshuas-projects-team-id',
  },
  teams: [
    {
      id: 'acme-corp-team-id',
      name: 'ACME Corp',
    },
    {
      id: 'joshuas-projects-team-id',
      name: "Joshua's Projects",
    },
  ],
  projects: [
    {
      id: 'demo-project-id',
      name: 'acme-store',
      accountId: 'acme-corp-team-id',
      createdAt: daysAgo(11),
      alias: [
        {
          deployment: true,
          domain: 'demo.vercel.store',
        },
      ],
      link: {
        type: 'github',
        org: 'acme',
        repo: 'store',
      },
      latestDeployments: [
        {
          meta: {
            githubDeployment: '1',
            githubOrg: 'acme',
            githubRepo: 'store',
            githubCommitRef: '5cd76e2',
            githubCommitSha: '1cd5cd76fa5cd96fa22e',
            githubCommitMessage: `
fix: center buttons and rename variables

- 11 more tests are added
- change theme colors from purple to peppermint
`,
            githubCommitAuthorName: 'Joshua',
          },
        },
      ],
    },
    {
      id: 'demo-project-id-2',
      name: 'acme-dashboard',
      accountId: 'acme-corp-team-id',
      createdAt: daysAgo(30),
      alias: [
        {
          deployment: true,
          domain: 'dash.acme.co',
        },
      ],
      link: {
        type: 'gitlab',
        projectId: 'demo-gitlab-project-id',
        projectName: 'dashboard',
        projectNamespace: 'acme',
        projectNameWithNamespace: 'acme/dashboard',
        projectUrl: 'https://gitlab.com/acme/internal/dashboard',
      },
    },
    {
      id: 'demo-project-id-3',
      name: 'ship-with-acme',
      accountId: 'acme-corp-team-id',
      createdAt: daysAgo(47),
      alias: [
        {
          deployment: true,
          domain: 'ship.acme.co',
        },
      ],
      link: {
        type: 'bitbucket',
        name: 'acme',
        slug: 'acme',
        owner: 'acme',
        uuid: 'demo-bitbucket-uuid',
        workspaceUuid: 'demo-bitbucket-workspace-uuid',
      },
    },
    {
      id: 'demo-project-id-4',
      name: 'conf-2023',
      accountId: 'acme-corp-team-id',
      createdAt: daysAgo(365),
      alias: [
        {
          deployment: true,
          domain: 'conference2023.acme.co',
        },
      ],
    },
    {
      id: 'demo-project-id-5',
      name: 'acme-japan',
      accountId: 'acme-corp-team-id',
      createdAt: daysAgo(281),
      alias: [
        {
          deployment: true,
          domain: 'jp.acme.co',
        },
      ],
    },
    {
      id: 'demo-project-id-6',
      name: 'joshua-dev',
      accountId: 'joshuas-projects-team-id',
      createdAt: daysAgo(100),
      alias: [
        {
          deployment: true,
          domain: 'joshua.ԁеν',
        },
      ],
    },
    {
      id: 'demo-project-id-7',
      name: 'blog-joshua-dev',
      accountId: 'joshuas-projects-team-id',
      createdAt: daysAgo(47),
      alias: [
        {
          deployment: true,
          domain: 'blog.joshua.ԁеν',
        },
      ],
    },
  ] satisfies PlainVercelProject[],
  deployments: [
    {
      uid: 'demo-deployment-id',
      name: 'acme-store',
      createdAt: minsAgo(1),
      state: VercelDeploymentState.Building,
      target: 'production',
      source: 'git',
      url: 'store-d14e3af.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'store',
        githubCommitRef: 'main',
        githubCommitSha: '3d35ce76ff5cd56fa2e2',
        githubCommitMessage: 'fix: revert previous changes',
        githubCommitAuthorName: 'Anthony',
      },
    },
    {
      uid: 'demo-deployment-id-2',
      name: 'acme-store',
      createdAt: minsAgo(20),
      state: VercelDeploymentState.Error,
      target: 'production',
      source: 'git',
      url: 'store-b5e21fa.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'store',
        githubCommitRef: 'main',
        githubCommitSha: '52d5ce76ff5c5d6af2e2',
        githubCommitMessage: 'chore: update to latest left-pad',
        githubCommitAuthorName: 'James',
      },
    },
    {
      uid: 'demo-deployment-id-3',
      name: 'acme-store',
      createdAt: minsAgo(45),
      state: VercelDeploymentState.Ready,
      target: 'production',
      source: 'git',
      url: 'store-f62e1af.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'store',
        githubCommitRef: 'dev',
        githubCommitSha: '6d25ce67df5c5d6af2e2',
        githubCommitMessage: 'chore: update a typo',
        githubCommitAuthorName: 'Tim',
      },
    },
    {
      uid: 'demo-deployment-id-4',
      name: 'acme-store',
      createdAt: minsAgo(200),
      state: VercelDeploymentState.Canceled,
      target: 'production',
      source: 'git',
      url: 'store-ff6e21a.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'store',
        githubCommitRef: 'main',
        githubCommitSha: '8ad56e67df5ced6afde1',
        githubCommitMessage: 'refactor: change title cases',
        githubCommitAuthorName: 'Samantha',
      },
    },
    {
      uid: 'demo-deployment-id-5',
      name: 'acme-store',
      createdAt: minsAgo(300),
      state: VercelDeploymentState.Ready,
      target: null,
      source: 'git',
      url: 'store-df55e3c.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'store',
        githubCommitRef: 'feature-a',
        githubCommitSha: '9ad65e6d7f6ecda6fde1',
        githubCommitMessage: "fix: as an AI model I'm not capable of gener...",
        githubCommitAuthorName: 'Tim',
      },
    },
    {
      uid: 'demo-deployment-id-6',
      name: 'acme-store',
      createdAt: minsAgo(5),
      state: VercelDeploymentState.Queued,
      target: null,
      source: 'git',
      url: 'store-kmt5e3k.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'store',
        githubCommitRef: 'main',
        githubCommitSha: '0a56de6d7f6fcde6fd91',
        githubCommitMessage: 'test!: add mock data',
        githubCommitAuthorName: 'Anthony',
      },
    },
    {
      uid: 'demo-deployment-id-7',
      name: 'acme-japan-web',
      createdAt: minsAgo(2),
      state: VercelDeploymentState.Ready,
      target: 'production',
      source: 'git',
      url: 'acme-japan-123.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'japan',
        githubCommitRef: 'main',
        githubCommitSha: 'a05d6e6d76ffcd6efd19',
        githubCommitMessage: 'chore(ui): fix kanji spellings',
        githubCommitAuthorName: 'Totoro',
      },
    },
    {
      uid: 'demo-deployment-id-8',
      name: 'acme-japan-web',
      createdAt: minsAgo(13),
      state: VercelDeploymentState.Ready,
      target: null,
      source: 'git',
      url: 'acme-japan-456.vercel.app',
      meta: {
        githubDeployment: '1',
        githubOrg: 'acme',
        githubRepo: 'japan',
        githubCommitRef: 'main',
        githubCommitSha: 'd50de66d76fcfd6fed19',
        githubCommitMessage: 'chore(ui): change katakana font',
        githubCommitAuthorName: 'Suzume',
      },
    },
    {
      uid: 'demo-deployment-id-9',
      name: 'acme-japan-api',
      createdAt: daysAgo(11),
      state: VercelDeploymentState.Ready,
      target: null,
      source: 'cli',
      url: 'acme-japan-456.vercel.app',
      meta: {},
    },
  ] satisfies PlainVercelDeploymentListed[],
  envs: {
    API_URL: 'https://api.vercel.com',
    ACCESS_TOKEN: '•••••••••••••',
  },
  deploymentEvents: [
    {
      type: 'stdout',
      created: 1723829527697,
      text: 'Cloning github.com/acme/store (Branch: main, Commit: 9e222e2)',
    },
    {
      type: 'stdout',
      created: 1723829527865,
      text: 'Previous build cache not available',
    },
    {
      type: 'stdout',
      created: 1723829528450,
      text: 'Cloning completed: 752.399ms',
    },
    {
      type: 'stdout',
      created: 1723829528715,
      text: 'Running "vercel build"',
    },
    {
      type: 'stdout',
      created: 1723829529292,
      text: 'Vercel CLI 28.14.1',
    },
    {
      type: 'stdout',
      created: 1723829529457,
      text: '> Automatically detected Turbo monorepo manager. Attempting to assign default settings.',
    },
    {
      type: 'stdout',
      created: 1723829529690,
      text: 'Detected `pnpm-lock.yaml` generated by pnpm 7...',
    },
    {
      type: 'stdout',
      created: 1723829529701,
      text: 'Running "install" command: `pnpm install`...',
    },
    {
      type: 'stdout',
      created: 1723829530432,
      text: 'Scope: all 3 workspace projects',
    },
    {
      type: 'stdout',
      created: 1723829531586,
      text: 'Packages are hard linked from the content-addressable store to the virtual store.',
    },
    {
      type: 'stdout',
      created: 1723829531586,
      text: '  Content-addressable store is at: /vercel/.local/share/pnpm/store/v3',
    },
    {
      type: 'stdout',
      created: 1723829531586,
      text: '  Virtual store is at:             ../../node_modules/.pnpm',
    },
    {
      type: 'stdout',
      created: 1723829555267,
      text: '.../sharp@0.31.2/node_modules/sharp install$ (node install/libvips && node install/dll-copy && prebuild-install) || (node install/can-compile && node-gyp rebuild && node install/dll-copy)',
    },
    {
      type: 'stdout',
      created: 1723829555447,
      text: '.../sharp@0.31.2/node_modules/sharp install: sharp: Downloading https://github.com/lovell/sharp-libvips/releases/download/v8.13.3/libvips-8.13.3-linux-x64.tar.br',
    },
    {
      type: 'stdout',
      created: 1723829556147,
      text: '.../sharp@0.31.2/node_modules/sharp install: sharp: Integrity check passed for linux-x64',
    },
    {
      type: 'stdout',
      created: 1723829556669,
      text: '.../sharp@0.31.2/node_modules/sharp install: Done',
    },
    {
      type: 'stdout',
      created: 1723829556847,
      text: '.../.pnpm/turbo@1.7.1/node_modules/turbo postinstall$ node install.js',
    },
    {
      type: 'stdout',
      created: 1723829556847,
      text: '.../esbuild@0.16.17/node_modules/esbuild postinstall$ node install.js',
    },
    {
      type: 'stdout',
      created: 1723829556881,
      text: '.../node_modules/@swc/core postinstall$ node postinstall.js',
    },
    {
      type: 'stdout',
      created: 1723829556977,
      text: '.../esbuild@0.16.17/node_modules/esbuild postinstall: Done',
    },
    {
      type: 'stdout',
      created: 1723829556983,
      text: '.../.pnpm/turbo@1.7.1/node_modules/turbo postinstall: Done',
    },
    {
      type: 'stdout',
      created: 1723829557073,
      text: '.../node_modules/@swc/core postinstall: Done',
    },
    {
      type: 'stdout',
      created: 1723829557595,
      text: '',
    },
    {
      type: 'stdout',
      created: 1723829557595,
      text: 'dependencies:',
    },
    {
      type: 'stdout',
      created: 1723829557595,
      text: '+ cors 2.8.5',
    },
    {
      type: 'stdout',
      created: 1723829557595,
      text: '+ graphql 16.6.0',
    },
    {
      type: 'stdout',
      created: 1723829557596,
      text: '+ next 13.1.1',
    },
    {
      type: 'stdout',
      created: 1723829557596,
      text: '+ octokit 2.0.11',
    },
    {
      type: 'stdout',
      created: 1723829557596,
      text: '+ react 18.2.0',
    },
    {
      type: 'stdout',
      created: 1723829557596,
      text: '+ react-dom 18.2.0',
    },
    {
      type: 'stdout',
      created: 1723829557596,
      text: '',
    },
    {
      type: 'stdout',
      created: 1723829557596,
      text: 'devDependencies:',
    },
    {
      type: 'stdout',
      created: 1723829557597,
      text: '+ @types/cors 2.8.13',
    },
    {
      type: 'stdout',
      created: 1723829557597,
      text: '+ @types/node 18.11.18',
    },
    {
      type: 'stdout',
      created: 1723829557598,
      text: '+ @types/react 18.0.26',
    },
    {
      type: 'stdout',
      created: 1723829557598,
      text: '+ @types/react-dom 18.0.10',
    },
    {
      type: 'stdout',
      created: 1723829557598,
      text: '+ eslint 8.31.0',
    },
    {
      type: 'stdout',
      created: 1723829557599,
      text: '+ typescript 4.9.4',
    },
    {
      type: 'stdout',
      created: 1723829557599,
      text: '',
    },
    {
      type: 'stdout',
      created: 1723829557599,
      text: 'Done in 27.8s',
    },
    {
      type: 'stdout',
      created: 1723829557634,
      text: 'Detected Next.js version: 13.1.1',
    },
    {
      type: 'stdout',
      created: 1723829557687,
      text: 'Running "cd ../.. && npx turbo run build --filter={apps/api}..."',
    },
    {
      type: 'stdout',
      created: 1723829558265,
      text: '• Packages in scope: api',
    },
    {
      type: 'stdout',
      created: 1723829558266,
      text: '• Running build in 1 packages',
    },
    {
      type: 'stdout',
      created: 1723829558266,
      text: '• Remote caching enabled',
    },
    {
      type: 'stdout',
      created: 1723829558998,
      text: 'api:build: cache hit, replaying output 21b39329c1e5aeae',
    },
    {
      type: 'stdout',
      created: 1723829558998,
      text: 'api:build:',
    },
    {
      type: 'stdout',
      created: 1723829558998,
      text: 'api:build: > api@ build /vercel/path0/apps/api',
    },
    {
      type: 'stdout',
      created: 1723829558998,
      text: 'api:build: > next build',
    },
    {
      type: 'stdout',
      created: 1723829558998,
      text: 'api:build:',
    },
    {
      type: 'stdout',
      created: 1723829558999,
      text: 'api:build: info  - Linting and checking validity of types...',
    },
    {
      type: 'stdout',
      created: 1723829558999,
      text: 'api:build: warn  - The Next.js plugin was not detected in your ESLint configuration. See https://nextjs.org/docs/basic-features/eslint#migrating-existing-config',
    },
    {
      type: 'stdout',
      created: 1723829558999,
      text: 'api:build: info  - Creating an optimized production build...',
    },
    {
      type: 'stdout',
      created: 1723829558999,
      text: 'api:build: info  - Compiled successfully',
    },
    {
      type: 'stdout',
      created: 1723829558999,
      text: 'api:build: info  - Collecting page data...',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: info  - Generating static pages (0/2)',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: info  - Generating static pages (2/2)',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: info  - Finalizing page optimization...',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build:',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: Route (pages)                              Size     First Load JS',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: ┌ ○ /404                                   182 B            77 kB',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: ├ λ /api/download-files                    0 B            76.8 kB',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: ├ λ /api/send-email                        0 B            76.8 kB',
    },
    {
      type: 'stdout',
      created: 1723829559000,
      text: 'api:build: └ λ /api/report-user                       0 B            76.8 kB',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build: + First Load JS shared by all              76.8 kB',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build:   ├ chunks/framework-52d05cc1420652be.js   45.2 kB',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build:   ├ chunks/main-b1487a84dd49dbf0.js        30.8 kB',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build:   ├ chunks/pages/_app-dcb5178293815227.js  195 B',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build:   └ chunks/webpack-34d8ad24d5d3f9f4.js     591 B',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build:',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build: λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build: ○  (Static)  automatically rendered as static HTML (uses no initial props)',
    },
    {
      type: 'stdout',
      created: 1723829559001,
      text: 'api:build:',
    },
    {
      type: 'stdout',
      created: 1723829559002,
      text: '',
    },
    {
      type: 'stdout',
      created: 1723829559002,
      text: ' Tasks:    1 successful, 1 total',
    },
    {
      type: 'stdout',
      created: 1723829559002,
      text: 'Cached:    1 cached, 1 total',
    },
    {
      type: 'stdout',
      created: 1723829559002,
      text: '  Time:    792ms >>> FULL TURBO',
    },
    {
      type: 'stdout',
      created: 1723829559002,
      text: '',
    },
    {
      type: 'stdout',
      created: 1723829560443,
      text: 'Traced Next.js server files in: 1.351s',
    },
    {
      type: 'stdout',
      created: 1723829561137,
      text: 'Created all serverless functions in: 690.942ms',
    },
    {
      type: 'stdout',
      created: 1723829561145,
      text: 'Collected static files (public/, static/, .next/static): 5.526ms',
    },
    {
      type: 'stdout',
      created: 1723829561772,
      text: 'Build Completed in /vercel/output [32s]',
    },
    {
      type: 'stdout',
      created: 1723829567127,
      text: 'Generated build outputs:',
    },
    {
      type: 'stdout',
      created: 1723829567128,
      text: ' - Static files: 12',
    },
    {
      type: 'stdout',
      created: 1723829567128,
      text: ' - Prerenders: 0',
    },
    {
      type: 'stdout',
      created: 1723829567128,
      text: ' - Serverless Functions: 4',
    },
    {
      type: 'stdout',
      created: 1723829567128,
      text: ' - Edge Functions: 0',
    },
    {
      type: 'stdout',
      created: 1723829567128,
      text: 'Serverless regions: Washington, D.C., USA',
    },
    {
      type: 'stdout',
      created: 1723829567128,
      text: 'Deployed outputs in 3s',
    },
    {
      type: 'stdout',
      created: 1723829567487,
      text: 'Build completed. Populating build cache...',
    },
    {
      type: 'stdout',
      created: 1723829583577,
      text: 'Uploading build cache [150.43 MB]...',
    },
    {
      type: 'stdout',
      created: 1723829586258,
      text: 'Build cache uploaded: 2.680s',
    },
  ] as VercelDeploymentEvent[],
  deploymentFileTree: [
    {type: 'directory', name: '_next'},
    {type: 'directory', name: 'api'},
    {type: 'file', name: '404', link: ''},
    {type: 'file', name: '500', link: ''},
    {type: 'file', name: 'favicon.ico', link: ''},
    {type: 'file', name: 'globals.css', link: ''},
    {type: 'file', name: 'index.html', link: ''},
    {type: 'file', name: 'robots.txt', link: ''},
  ] satisfies VercelFile[],
  deploymentFileContents: {
    html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="./favicon.ico" />
    <title>Acme Store</title>
    <meta name="description" content="Acme Store" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
    `,
    css: `
html {
  font-family: system-ui, sans-serif;
  background: #13151a;
}
`,
    js: `
const buffer = window.content instanceof Buffer ? content : Buffer.from(content, 'utf-8')
await vscode.workspace.fs.writeFile(file, buffer)
    `,
    txt: `
User-agent: *
Disallow: /
    `,
    ico: 'AAABAAMAMDAAAAEAIAD9JQAANgAAACAgAAABACAA/RAAAP0lAAAQEAAAAQAgAGgEAAD9NgAAKAAAADAAAABgAAAAAQAgAAAAAAAAJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANAAAANwAAAG8AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAbwAAADcAAAANAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAKAAAAHMAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAcwAAACgAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAC4AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAALgAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAAAfQAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAH0AAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAADsAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAOwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAXgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAF4AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAByAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAByAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAHIAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAcgAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXwAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAF4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAfQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALwAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAC4AAAAAAAAAAAAAAAAAAAACAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAABAAAAAAAAAAAAAAApAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAAoAAAAAAAAAAAAAABzAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/UZGRv39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39dnZ2/Q4ODv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABzAAAAAAAAAA0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/TY2Nv39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/QICAv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAADQAAADcAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QEBAf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39IiIi/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAANwAAAG8AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0fHx/9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f1ra2v9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAbwAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9Z2dn/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f0TExP9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9ERER/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/VBQUP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/UtLS/39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/QgICP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QcHB/39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39Nzc3/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0zMzP9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39AQEB/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0BAQH9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f0iIiL9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9Hx8f/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/Wtra/0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/WdnZ/39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/RMTE/0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/REREf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39UFBQ/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP1LS0v9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39CAgI/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAG8AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0HBwf9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f03Nzf9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAbwAAADcAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9MzMz/f39/f39/f39/f39/f39/f39/f39/f39/f39/f0BAQH9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAANwAAAA0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AQEB/f39/f39/f39/f39/f39/f39/f39/f39/SIiIv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAADQAAAAAAAABzAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/R8fH/39/f39/f39/f39/f39/f39a2tr/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABzAAAAAAAAAAAAAAApAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP1nZ2f9/f39/f39/f39/f39ExMT/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAApAAAAAAAAAAAAAAABAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0RERH9/f39/f39/f1QUFD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAACAAAAAAAAAAAAAAAAAAAALgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9Tk5O/f39/f0JCQn9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAC8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9BwcH/RISEv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAfQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAF8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAHIAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAcgAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAByAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAByAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAXgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAF4AAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAADsAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAOwAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWAAAAfQAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAH0AAAAWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAC4AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAALgAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAKAAAAHMAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAcwAAACgAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANAAAANwAAAG8AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAbwAAADcAAAANAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP39/Qf9/QAA/f0AAP39AAD9/QAAH/0AAP39AAAP/QAA/f0AAAP9AAD9/QAAAf0AAP0AAAAA/QAA/QAAAAB/AAD9AAAAAD8AAP0AAAAAHwAA/QAAAAAPAAD9AAAAAA8AAP0AAAAABwAA/QAAAAADAAD9AAAAAAMAAP0AAAAAAwAA/QAAAAABAAD9AAAAAAEAAP0AAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9AAAAAAEAAP0AAAAAAQAA/QAAAAABAAD9AAAAAAMAAP0AAAAAAwAA/QAAAAADAAD9AAAAAAcAAP0AAAAADwAA/QAAAAAPAAD9AAAAAB8AAP0AAAAAPwAA/QAAAAB/AAD9AAAAAP0AAP39AAAB/QAA/f0AAAP9AAD9/QAAD/0AAP39AAAf/QAA/f0AAP39AAD9/f0H/f0AACgAAAAgAAAAQAAAAAEAIAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAKgAAAG0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAG0AAAAqAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAANwAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAANwAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAABoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADYAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAADYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAEIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAADYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABoAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAABoAAAAAAAAAAAAAAAAAAAACAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAAIAAAAAAAAAAAAAADgAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAOAAAAAAAAAADAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QMDA/0DAwP9AwMD/QMDA/0DAwP9AwMD/QMDA/0DAwP9AwMD/QMDA/0DAwP9AwMD/QMDA/0DAwP9AwMD/QQEBP0BAQH9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAAwAAACoAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9X19f/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/QwMDP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAAqAAAAbQAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP04ODj9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f1xcXH9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAG0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QEBAf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/RQUFP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/SEhIf39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f1RUVH9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/Wpqav39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/QgICP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9EhIS/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f04ODj9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9Tk5O/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/QICAv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0ICAj9/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f0jIyP9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP02Njb9/f39/f39/f39/f39/f39/f39/f39/f39bW1t/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QEBAf39/f39/f39/f39/f39/f39/f39/f39/f0UFBT9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAbQAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/SEhIf39/f39/f39/f39/f39/f39UVFR/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAG0AAAAqAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/Wpqav39/f39/f39/f39/f0ICAj9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAKgAAAAMAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9EhIS/f39/f39/f39ODg4/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAADAAAAAAAAADgAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9UFBQ/X9/f/0DAwP9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAOAAAAAAAAAAAAAAAAgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0GBgb9CwsL/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAACAAAAAAAAAAAAAAAAAAAAGgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAGgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAADYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAABoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAADcAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAADcAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAqAAAAbQAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAbQAAACoAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/f0P/f39Af39AAB//QAAP/0AAB/9AAAP/QAAB/0AAAP9AAAD/QAAAf0AAAH9AAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD9AAAB/QAAAf0AAAH9AAAD/QAAA/0AAAf9AAAP/QAAH/0AAD/9AAB//f0B/f39D/0oAAAAEAAAACAAAAABACAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAEkAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABJAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAAYAAAAAAAAAAAAAAAAAAAAGAAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAABgAAAAAAAAABgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAABgAAAEkAAAD9AAAA/QEBAf0MDAz9Dg4O/Q4ODv0ODg79Dg4O/Q4ODv0ODg79DQ0N/QICAv0AAAD9AAAA/QAAAEkAAAD9AAAA/QAAAP0BAQH9eHh4/f39/f39/f39/f39/f39/f39/f39/f39/f39/f0ICAj9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/To6Ov39/f39/f39/f39/f39/f39/f39/f39/f1VVVX9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0CAgL9/f39/f39/f39/f39/f39/f39/f39/f39CQkJ/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/SQkJP39/f39/f39/f39/f39/f39Ojo6/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9bW1t/f39/f39/f39/f39/QICAv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/RQUFP39/f39/f39/SUlJf0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABJAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9UFBQ/WZmZv0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABJAAAABgAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QQEBP0GBgb9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAABgAAAAAAAAAYAAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAGAAAAAAAAAAAAAAAAAAAABgAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAAD9AAAAGAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAEkAAAD9AAAA/QAAAP0AAAD9AAAA/QAAAP0AAABJAAAABwAAAAAAAAAAAAAAAP0fAAD9BwAA/QMAAP0BAAD9AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/QEAAP0BAAD9AwAA/QcAAP0fAAA=',
  },
  deploymentChecks: [],
}
