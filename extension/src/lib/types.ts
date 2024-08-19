// biome-ignore lint/suspicious/noExplicitAny: There's no other way.
export type Constructable<T = unknown> = {new (...params: any[]): T}

export type InjectionToken<T = unknown> = string | symbol | Constructable<T>

export type OnExtensionBootstrap = {onExtensionBootstrap(): Promise<void>}
