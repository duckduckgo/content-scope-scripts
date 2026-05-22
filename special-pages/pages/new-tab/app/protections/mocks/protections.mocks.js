/**
 * @import { ProtectionsData } from "../../../types/new-tab";
 * @type {Record<string, ProtectionsData>}
 */
export const protectionsMocks = {
    empty: {
        totalCount: 0,
        totalCookiePopUpsBlocked: 0,
    },
    few: {
        totalCount: 86,
        totalCookiePopUpsBlocked: 21,
    },
    many: {
        totalCount: 1_000_020,
        totalCookiePopUpsBlocked: 5_432,
    },
    // @todo legacyProtections: Remove legacy mock once all platforms are ready
    // for the new protections report
    legacy: {
        totalCount: 86,
        totalCookiePopUpsBlocked: undefined,
    },
};
