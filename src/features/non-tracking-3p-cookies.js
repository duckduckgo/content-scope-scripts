import { blockCookies } from './tracking-cookies-3p'

export function init (args) {
    args.cookie.debug = args.debug
    if (globalThis.top !== globalThis && !args.cookie.isTrackerFrame && args.cookie.shouldBlockNonTrackerCookie && args.cookie.isThirdParty) {
        // overrides expiry policy with blocking - only in subframes
        blockCookies(args.debug)
    }
}
