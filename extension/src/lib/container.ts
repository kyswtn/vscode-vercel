import * as vscode from 'vscode'
import type {Constructable, InjectionToken} from './types'
import {getParamTypes, isDisposable} from './utils'

type DependencyFields =
  | {
      strategy: 'useValue'
      cache: unknown
    }
  | {
      strategy: 'useClass'
      cache?: unknown
      dependencies: InjectionToken[]
    }

/**
 * This is a version of Constructor-based Dependency Injection based on TypeScript types using the
 * proposed `Reflect` API. It is highly inspired by Angular, NestJS, and Tsyringe.
 *
 * The container here is the most important piece in making such mechanism work. Dependency
 * `Injectable` class constructors are registered into the container and the container turn them
 * into working __singleton__ instances with dependencies resolved.
 *
 * The container is able to do that by keeping track of registered class constructors in a table
 * alongside it's dependencies.
 *
 *     ┌──────────────────┬───────────────┬───────────────┬──────────────────────┐
 *     │      Token       │   Strategy    │     Cache     │     Dependencies     │
 *     ├──────────────────┼───────────────┼───────────────┼──────────────────────┤
 *     │      String      │               │               │                      │
 *     ├──────────────────┤   useValue    │     value     │         NULL         │
 *     │      Symbol      │               │               │                      │
 *     ├──────────────────┼───────────────┼───────────────┼──────────────────────┤
 *     │  Constructable   │   useClass    │    instance   │       Token[]        │
 *     └──────────────────┴───────────────┴───────────────┴──────────────────────┘
 *
 * This is a stripped down version of Dependency Injection provided by frameworks such as Angular
 * and NestJS with only minimal features needed. A common strategy `useFactory` is not supported
 * and the dependencies are only resolvable as singletons.
 */
export class Container implements vscode.Disposable {
  private readonly store = new Map<InjectionToken, DependencyFields>()
  private readonly resolving = new Set<Constructable>()
  private readonly subscriptions: vscode.Disposable[] = []

  register(token: string | symbol, value: unknown): void
  register(token: Constructable): void
  register(token: InjectionToken, value?: unknown) {
    if (typeof token === 'function') {
      this.store.set(token, {
        strategy: 'useClass',
        dependencies: getParamTypes(token),
      })
    } else if (typeof token === 'string' || typeof token === 'symbol') {
      this.store.set(token, {
        strategy: 'useValue',
        cache: value,
      })
    }
  }

  resolve<T>(token: InjectionToken<T>): T {
    const tokenName = typeof token === 'function' ? token.name : token.toString()
    const stored = this.store.get(token)

    if (stored === undefined) {
      throw new Error(`Attempted to resolve unregistered dependency token "${tokenName}".`)
    }

    if (stored.strategy === 'useClass' && !stored.cache) {
      const ctor = token as Constructable<T>

      if (this.resolving.has(ctor)) {
        throw new Error(`Attempted to construct a circular dependency "${tokenName}".`)
      }

      this.resolving.add(ctor)
      stored.cache = this.resolveConstructor(ctor, stored.dependencies)
      this.resolving.delete(ctor)
    }

    return stored.cache as T
  }

  override(token: InjectionToken, value: unknown) {
    const existing = this.store.get(token)
    if (!existing) {
      const tokenName = typeof token === 'function' ? token.name : token.toString()
      throw new Error(`Attempted to construct a circular dependency "${tokenName}".`)
    }

    this.store.set(token, {...existing, cache: value})
  }

  private resolveConstructor<T>(ctor: Constructable<T>, dependencies: InjectionToken[]): T {
    let instance: T

    if (dependencies.length === 0) {
      instance = new ctor()
    } else {
      const params = dependencies.map((param) => this.resolve(param))
      instance = new ctor(...params)
    }

    if (isDisposable(instance)) {
      this.subscriptions.push(instance)
    }

    return instance
  }

  dispose() {
    vscode.Disposable.from(...this.subscriptions).dispose()
  }
}
