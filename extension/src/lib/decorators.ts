import {
  EXTENSION_CONTEXT_TOKEN,
  GLOBAL_STATE_TOKEN,
  INJECTABLE_WATERMARK,
  SECRET_STORAGE_TOKEN,
  SELF_DECLARED_DEPS_METADATA,
  WORKSPACE_STATE_TOKEN,
} from './constants'

export function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target)
  }
}

export function Inject(token: string | symbol): ParameterDecorator {
  return (target, _propertyKey, parameterIndex) => {
    const metadataValue = Reflect.getOwnMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? {}
    metadataValue[parameterIndex] = token
    Reflect.defineMetadata(SELF_DECLARED_DEPS_METADATA, metadataValue, target)
  }
}

type ContextField = 'workspaceState' | 'globalState' | 'secrets'
const fieldToTokens: Record<ContextField, symbol> = {
  globalState: GLOBAL_STATE_TOKEN,
  workspaceState: WORKSPACE_STATE_TOKEN,
  secrets: SECRET_STORAGE_TOKEN,
}

export function InjectContext(field?: ContextField): ParameterDecorator {
  let token = EXTENSION_CONTEXT_TOKEN
  if (field) token = fieldToTokens[field]
  return Inject(token)
}
