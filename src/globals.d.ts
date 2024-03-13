declare const mozProxies: boolean
declare function exportFunction(fn: () => unknown, desc: object, out: object): void;
declare function exportFunction(fn: () => unknown, desc: object): void;
declare function cloneInto(fn: object, desc: object, out: object): void;
declare function cloneInto(fn: object, desc: object): void;
declare namespace contentScopeFeatures {
    function init(args: object): void;
    function load(args: object): void;
    function update(args: object): void;
}

/**
 * Allows checks like `import.meta.env === "development"'
 */
interface ImportMeta {
    env: 'production' | 'development'
    platform?: 'windows' | 'macos'
    // this represents the different build artifact names
    injectName?: 'firefox' | 'apple' | 'apple-isolated' | 'android' | 'windows' | 'integration' | 'chrome-mv3' | 'chrome'
    trackerLookup?: Record<string, unknown>
}

declare module '*.svg' {
    const content: string
    export default content
}
declare module '*.module.css' {
    const content: Record<string, string>
    export default content
}
declare module '*.css' {
    const content: string
    export default content
}
declare module '*.riv' {
    const filepath: string
    export default filepath
}

declare module 'ddg:platformFeatures' {
    const output: Record<string, new (featureName: string) => import('./content-feature').default>
    export default output
}

declare module 'ddg:runtimeInjects' {
    const output: Record<string, string>
    export default output
}

interface MessageTypes {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requests?: Record<string, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notifications?: Record<string, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    subscriptions?: Record<string, any>
}

interface MessagingBase<T extends MessageTypes> {
    notify<
      Method extends T['notifications']['method'],
      Msg = Extract<T['notifications'], { method: Method }>,
    >(...args: Msg extends { params: infer P } ? [Method, P]: [Method]): void
    request<
      Method extends T['requests']['method'],
      Msg = Extract<T['requests'], { method: Method }>,
      Return = Msg extends { result: infer Result } ? Result : void
    >(...args: Msg extends { params: infer P } ? [Method, P]: [Method]): Promise<Return>
}
