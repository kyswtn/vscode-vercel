type PrimitiveTypes = 'string' | 'number' | 'boolean' | 'record' | 'array'

export function makeNaiveObjectValidator<T>(typeName: string, schema: Partial<Record<keyof T, PrimitiveTypes>>) {
  return (object: unknown) => {
    const errors: Error[] = []

    if (typeof object !== 'object' || object === null) {
      errors.push(new Error(`${typeName} should be an object.`))
      return errors
    }

    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in object)) {
        errors.push(new Error(`Required field "${key}" missing from ${typeName}.`))
        continue
      }

      // SAFETY:
      // `object` must be `Record<string, unknown>` as confirmed by the condition outside of loop.
      const value = (object as Record<string, unknown>)[key]
      switch (expectedType) {
        case 'string':
        case 'number':
        case 'boolean':
          // biome-ignore lint/suspicious/useValidTypeof: Dumb linter.
          if (typeof value !== expectedType) {
            errors.push(new Error(`Unexpected value "${value}" for "${key}".`))
          }
          break
        case 'record':
          if (typeof value !== 'object') {
            errors.push(new Error(`Unexpected type "${typeof value}" for "${key}".`))
          } else if (value === null) {
            errors.push(new Error(`Unexpected value "null" for "${key}".`))
          } else if (Array.isArray(value)) {
            errors.push(new Error(`Unexpected type "array" for "${key}".`))
          }
          break
        case 'array':
          if (typeof value !== 'object') {
            errors.push(new Error(`Unexpected type "${typeof value}" for "${key}".`))
          } else if (value === null) {
            errors.push(new Error(`Unexpected value "null" for "${key}".`))
          } else if (!Array.isArray(value)) {
            errors.push(new Error(`Unexpected type "record" for "${key}".`))
          }
          break
        default:
          throw new Error(`Unknown validation type "${expectedType}".`)
      }
    }

    return errors
  }
}
