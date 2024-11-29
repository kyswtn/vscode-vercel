import {defineConfig} from 'astro/config'

import react from '@astrojs/react'
import compress from '@playform/compress'
import unocss from 'unocss/astro'

// https://astro.build/config
export default defineConfig({
  site: 'https://vscode-extension.vercel.app',
  markdown: {
    syntaxHighlight: false,
  },
  integrations: [react(), unocss(), compress()],
})
