import * as vscode from 'vscode'
import {INJECTABLE_WATERMARK, PARAMTYPES_METADATA, SELF_DECLARED_DEPS_METADATA} from './constants'
import type {Constructable, InjectionToken, OnExtensionBootstrap} from './types'

/**
 * Get an array of parameter types for a given class constructor decorated as `Injectable`.
 * Parameters decorated with `SELF_DECLARED_DEPS_METADATA` will have the types replaced with the
 * values provided by the decorator.
 */
export function getParamTypes(target: Constructable): InjectionToken[] {
  const hasWatermark: boolean = Reflect.getMetadata(INJECTABLE_WATERMARK, target) ?? false
  if (!hasWatermark) {
    throw new Error(`Missing "@Injectable" decorator for "${target.name}"`)
  }

  const paramTypes: InjectionToken[] = Reflect.getMetadata(PARAMTYPES_METADATA, target) ?? []

  const tokens = Reflect.getOwnMetadata(SELF_DECLARED_DEPS_METADATA, target) ?? {}
  for (const parameterIndex in tokens) {
    paramTypes[+parameterIndex] = tokens[parameterIndex]!
  }

  return paramTypes
}

/**
 * Checks if value is a `Disposable`.
 *
 * Any non-null object with a `dispose` function that takes no parameters in it's properties is
 * considered a `Disposable`.
 */
export function isDisposable(value: unknown): value is vscode.Disposable {
  return (
    typeof value === 'object' &&
    value !== null &&
    'dispose' in value &&
    typeof value.dispose === 'function' &&
    value.dispose.length === 0
  )
}

export function isOnExtensionBootstrap(entry: unknown): entry is OnExtensionBootstrap {
  return typeof entry === 'object' && entry !== null && 'onExtensionBootstrap' in entry
}
