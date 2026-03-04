/**
 * Remote configuration types and exports.
 */

export type RemoteConfig = {
    features: Record<
        string,
        {
            state: string;
            settings: any;
            exceptions: { domain: string }[];
            minSupportedVersion?: string | number;
        }
    >;
    unprotectedTemporary: { domain: string }[];
};

export type Platform = {
    name: string;
    version?: string | number;
    internal?: boolean;
    preview?: boolean;
};

export type UserPreferences = {
    platform: Platform;
    [key: string]: any;
};

export type FeatureState = 'enabled' | 'disabled' | 'internal' | 'preview';

export type Site = {
    domain: string | null;
    url: string | null;
    isBroken?: boolean;
    allowlisted?: boolean;
    enabledFeatures?: string[];
};

export type LoadArgs = {
    site: Site;
    platform: Platform;
    bundledConfig?: RemoteConfig;
    messagingConfig?: any;
    messageSecret?: string;
    messagingContextName: string;
    currentCohorts?: Array<{ feature: string; cohort: string; subfeature: string }>;
    debug?: boolean;
    featureSettings?: Record<string, unknown>;
    assets?: any;
    stringExemptionLists?: Record<string, string[]>;
};

export type ConditionBlock = {
    domain?: string[] | string;
    urlPattern?: object;
    minSupportedVersion?: string | number;
    maxSupportedVersion?: string | number;
    experiment?: {
        experimentName: string;
        cohort: string;
    };
    context?: {
        frame?: boolean;
        top?: boolean;
    };
    injectName?: string;
    internal?: boolean;
    preview?: boolean;
};

/**
 * Base class for configuration-aware features.
 * Provides conditional config processing with support for domain matching,
 * experiment matching, version checks, and JSON patch-based settings overrides.
 */
export class ConfigFeature {
    name: string;
    args: LoadArgs | null;
    featureSettings: Record<string, unknown> | undefined;
    readonly bundledConfig: RemoteConfig | undefined;

    constructor(name: string, args: LoadArgs);

    recomputeSiteObject(): void;

    /**
     * Given a config key, interpret the value as a list of conditional objects,
     * and return the elements that match the current page.
     */
    matchConditionalFeatureSetting(featureKeyName: string): any[];

    /**
     * Return the value of a specific feature setting, with conditional changes applied.
     */
    getFeatureSetting(featureKeyName: string, featureName?: string): any;

    /**
     * Return whether a boolean feature setting is enabled.
     */
    getFeatureSettingEnabled(featureKeyName: string, defaultState?: FeatureState, featureName?: string): boolean;

    get injectName(): string | undefined;
}

export function processConfig(
    data: RemoteConfig,
    userList: string[],
    preferences: UserPreferences,
    platformSpecificFeatures?: string[],
): Record<string, any>;

export function getLoadArgs(processedConfig: Record<string, any>): LoadArgs;

export function computeEnabledFeatures(
    data: RemoteConfig,
    topLevelHostname: string | null,
    platform: Platform | undefined,
    platformSpecificFeatures?: string[],
): string[];

export function parseFeatureSettings(data: RemoteConfig, enabledFeatures: string[]): Record<string, unknown>;

export function isUnprotectedDomain(topLevelHostname: string | null, featureList: { domain: string }[]): boolean;

export function isStateEnabled(state: FeatureState | string | undefined, platform: Platform | undefined): boolean;

export function isSupportedVersion(minSupportedVersion: string | number, currentVersion?: string | number): boolean;

export function isMaxSupportedVersion(maxSupportedVersion: string | number, currentVersion?: string | number): boolean;

export function matchHostname(hostname: string, exceptionDomain: string): boolean;

export function computeLimitedSiteObject(): Site;

export function isGloballyDisabled(args: LoadArgs): boolean | undefined;

export function camelcase(dashCaseText: string): string;
