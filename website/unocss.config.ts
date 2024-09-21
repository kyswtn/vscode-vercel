import {defineConfig, presetTypography, presetWind, transformerDirectives} from 'unocss'
import {presetRadixColors} from 'unocss-preset-radix-colors'
import {type Theme, theme} from 'unocss/preset-wind'

type DefaultFontFamily = Record<'sans' | 'serif' | 'mono', string>
const systemFonts = theme.fontFamily as DefaultFontFamily

export default defineConfig<Theme>({
  extendTheme: (theme) => {
    return {
      ...theme,
      fontFamily: {
        'system-sans': systemFonts.sans,
        'system-serif': systemFonts.serif,
        // biome-ignore format: Single line reads better.
        headings: ["'New Title'", "'New Title Fallback'", systemFonts.sans].join(', '),
        // biome-ignore format: Single line reads better.
        serif: ["'Source Serif 4'", "'Source Serif 4 Fallback'", systemFonts.serif].join(', '),
        mono: systemFonts.mono,
      },
    }
  },
  transformers: [transformerDirectives()],
  presets: [
    presetWind({dark: 'media'}),
    presetTypography({
      cssExtend: {
        'p,ul,ol,pre': {
          'line-height': 1.5, // leading-snug
        },
        a: {
          'text-decoration-color': 'var(--un-prose-hr)',
          'text-underline-offset': '3px',
        },
        'a:hover': {
          'text-decoration-color': 'var(--un-prose-links)',
        },
        'code, pre': {
          'background-color': 'var(--un-prose-bg-soft) !important',
        },
        'code::before': {
          content: '""',
        },
        'code::after': {
          content: '""',
        },
      },
    }),
    presetRadixColors({
      colors: ['gray'],
      prefix: '',
      typography: true,
    }),
  ],
})
