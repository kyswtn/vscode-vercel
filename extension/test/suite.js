const path = require('pathe')
const Mocha = require('mocha')

function run(testsRunnerPath) {
  const testsRoot = path.resolve(path.dirname(testsRunnerPath), '../')
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  })

  return new Promise((resolve, reject) => {
    mocha.addFile(path.resolve(testsRoot, './dist/extension.test.js'))

    try {
      // Run the mocha test
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`))
        } else {
          resolve(undefined)
        }
      })
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = {run}
