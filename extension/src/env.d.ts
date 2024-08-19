declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'production' | 'development'

    readonly INTEGRATION_ID: string
    readonly CLIENT_ID: string
    readonly CLIENT_SECRET: string
    readonly REDIRECT_URI: string
  }
}
