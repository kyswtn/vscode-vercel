import {defineConfig} from 'astro/config'

import compress from '@playform/compress'
import purgecss from 'astro-purgecss'
import unocss from 'unocss/astro'

// https://astro.build/config
export default defineConfig({
  site: 'https://vscode-extension.vercel.app',
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [
    unocss(),
    purgecss({
      safelist: [/dark/, /prose/, /\[.*\]/],
      variables: true,
    }),
    compress(),
  ],
})
