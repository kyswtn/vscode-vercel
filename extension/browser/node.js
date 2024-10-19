// @ts-check
/** @type {typeof import('../src/utils/node')} */
const exports = {
  /** @type {() => NodeJS.Platform} */
  platform: () => 'linux',
  homedir: () => '/',
  // @ts-ignore
  crypto: globalThis.crypto,
}

module.exports = exports
