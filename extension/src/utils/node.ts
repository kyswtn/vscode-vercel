// Only use webcrypto subset for better compatibility with browser extension.
export {webcrypto as crypto} from 'node:crypto'
export {homedir, platform} from 'node:os'
