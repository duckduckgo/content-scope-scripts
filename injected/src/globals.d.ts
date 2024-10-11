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
    platform?: 'windows' | 'macos' | 'android' | 'ios'
    // this represents the different build artifact names
    injectName?: 'firefox' | 'apple' | 'apple-isolated' | 'android' | 'windows' | 'integration' | 'chrome-mv3' | 'chrome'
    trackerLookup?: Record<string, unknown>
    pageName?: string
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
