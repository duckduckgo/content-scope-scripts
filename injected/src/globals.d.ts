declare namespace contentScopeFeatures {
    function init(args: object): void;
    function load(args: object): void;
    function update(args: object): void;
}

/**
 * Allows checks like `import.meta.env === "development"'
 */
interface ImportMeta {
    env: 'production' | 'development';
    platform?: 'windows' | 'macos' | 'android' | 'ios' | 'extension';
    // this represents the different build artifact names
    injectName?:
        | 'firefox'
        | 'apple'
        | 'apple-isolated'
        | 'apple-ai-clear'
        | 'apple-ai-history'
        | 'android'
        | 'windows'
        | 'integration'
        | 'chrome-mv3'
        | 'android-broker-protection'
        | 'android-autofill-import'
        | 'android-adsjs'
        | 'android-ai-history';
    trackerLookup?: Record<string, unknown>;
    pageName?: string;
}

declare module '*.svg' {
    const content: string;
    export default content;
}
declare module '*.module.css' {
    const content: Record<string, string>;
    export default content;
}
declare module '*.css' {
    const content: string;
    export default content;
}
declare module '*.riv' {
    const filepath: string;
    export default filepath;
}

declare module 'ddg:platformFeatures' {
    type FeatureMap = import('./features.js').FeatureMap;
    type LoadArgs = import('./content-scope-features.js').LoadArgs;
    const output: Record<
        string,
        new <K extends keyof FeatureMap>(featureName: K, importConfig: *, features: Partial<FeatureMap>, args: LoadArgs) => FeatureMap[K]
    >;
    export default output;
}
