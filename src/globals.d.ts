declare var mozProxies: boolean;
declare function exportFunction(fn: Function, desc: object, out: object): void;
declare function exportFunction(fn: Function, desc: object): void;
declare function cloneInto(fn: object, desc: object, out: object): void;
declare function cloneInto(fn: object, desc: object): void;
declare namespace contentScopeFeatures {
    function init(args: Object): void;
    function load(args: Object): void;
    function update(args: Object): void;
}

/**
 * Allow `import.meta.env === "development"`
 */
interface ImportMeta {
    env?: "production" | "development"
    platform?: "windows" | "apple"
}
