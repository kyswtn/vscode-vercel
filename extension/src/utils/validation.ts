import {Logger} from '../lib'
import {AuthJson, type ProjectJson} from '../types'
import {makeNaiveObjectValidator} from './naive-object-validator'

const makeLoggingValidator = <T>(...options: Parameters<typeof makeNaiveObjectValidator>) => {
  const logger = new Logger(`${options[0]}Validation`)
  const validate = makeNaiveObjectValidator<T>(...options)

  return (object: unknown): object is T => {
    const errors = validate(object)
    for (const error of errors) {
      logger.error(error.message)
    }
    return errors.length === 0
  }
}

export const isValidAuthJson = makeLoggingValidator<AuthJson>('AuthJson', {
  token: 'string',
})

export const isValidProjectJson = makeLoggingValidator<ProjectJson>('ProjectJson', {
  orgId: 'string',
  projectId: 'string',
})

// Planning to migrate to Vercel official SDK, therefore trust will be built around types provided.
// All of these manual validation of API responses will be removed eventually.
//
// export const isValidVercelProject = makeLoggingValidator<PlainVercelProject>('VercelProject', {
//   id: 'string',
//   name: 'string',
//   createdAt: 'number',
//   accountId: 'string',
// })
//
// export const isValidVercelDeployment = makeLoggingValidator<PlainVercelDeployment>('VercelDeployment', {
//   uid: 'string',
//   name: 'string',
//   createdAt: 'number',
// })
//
// export const isValidVercelFile = makeLoggingValidator<VercelFile>('VercelFile', {
//   type: 'string',
//   name: 'string',
// })
//
// export const isValidVercelCheck = makeLoggingValidator<VercelCheck>('VercelCheck', {
//   id: 'string',
//   integrationId: 'string',
//   name: 'string',
//   createdAt: 'number',
//   updatedAt: 'number',
//   status: 'string',
// })
