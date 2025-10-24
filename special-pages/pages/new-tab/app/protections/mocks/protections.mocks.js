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
        totalCookiePopUpsBlocked: 23,
    },
    many: {
        totalCount: 1_000_020,
        totalCookiePopUpsBlocked: 5_432,
    },
};
