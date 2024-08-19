// @ts-check
/** @type {typeof import('../src/utils/node')} */
const exports = {
  // @ts-ignore
  crypto: globalThis.crypto,
  platform: () => 'linux',
  homedir: () => '/',
}
module.exports = exports
