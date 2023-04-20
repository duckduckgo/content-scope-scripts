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
    platform?: 'windows' | 'integration'
    injectName?: string
}

declare module '*.svg' {
    const content: string
    export default content
}

declare module '*.css' {
    const content: string
    export default content
}
