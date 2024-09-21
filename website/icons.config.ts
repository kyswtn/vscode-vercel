import {FileSystemIconLoader} from 'unplugin-icons/loaders'

// Custom icon collections.
export const collections = {
  local: FileSystemIconLoader('./src/icons', (svg) => svg),
}
