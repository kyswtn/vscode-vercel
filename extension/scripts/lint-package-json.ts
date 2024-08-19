import {contributes} from '../package.json'

let errorCount = 0
const error = (message) => {
  errorCount++
  console.error(`\x1b[31m${message}\x1b[0m`)
}

const commands = contributes.commands.map((c) => c.command)

// checks if any of the command ids are duplicated
const counts: Record<string, number> = {}
for (const command of commands) {
  counts[command] = (counts[command] ?? 0) + 1
}
for (const [command, count] of Object.entries(counts)) {
  if (count <= 1) continue
  error(`Command "${command}" is defined ${count} time${count > 1 ? 's' : ''}!`)
}

// make sure all the commands being used are defined
const menuCommandsNotDefined = Object.values(contributes.menus)
  .flat()
  .map((m) => m.command)
  .filter((mc) => !commands.includes(mc))
for (const command of menuCommandsNotDefined) {
  error(`Command "${command}" is used in menus but not defined!`)
}

const defaultViewContainers = ['debug', 'explorer', 'remote', 'scm', 'test']
const viewContainers = Object.values(contributes.viewsContainers)
  .flat()
  .map((vc) => vc.id)
  .concat(...defaultViewContainers)

// make sure all views belong to correct containers
const missingContainers = Object.keys(contributes.views)
  /*=>*/
  .filter((v) => !viewContainers.includes(v))
for (const container of missingContainers) {
  error(`A view is provided for container "${container}" which doesn't exit!`)
}

const views = Object.values(contributes.views)
  .flat()
  .map((v) => v.id)

// make sure welcome views reference to correct views
const missingViews = contributes.viewsWelcome
  .map((v) => v.view)
  .filter((v) => !views.includes(v))
for (const view of missingViews) {
  error(`A welcome view is provided for view "${view}" which doesn't exit!`)
}

if (errorCount) process.exit(1)
else console.log('\x1b[32mNo errors found; Good job!\x1b[0m')
