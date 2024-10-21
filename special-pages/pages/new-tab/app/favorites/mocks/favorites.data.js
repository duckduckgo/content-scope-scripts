/**
 * @typedef {import('../../../../../types/new-tab').Favorite} Favorite
 * @typedef {import('../../../../../types/new-tab').FavoritesData} FavoritesData
 * @typedef {import('../../../../../types/new-tab').FavoritesConfig} FavoritesConfig
 */

/**
 * @type {{
 *    many: {favorites: Favorite[]};
 *    single: {favorites: Favorite[]};
 *    none: {favorites: Favorite[]};
 *    two: {favorites: Favorite[]};
 * }}
 */
export const favorites = {
    many: {
        /** @type {Favorite[]} */
        favorites: [
            { id: 'id-many-1', data: 'https://example.com?id=id-many-1', title: 'Amazon', favicon: './company-icons/amazon.svg' },
            { id: 'id-many-2', data: 'https://example.com?id=id-many-2', title: 'Adform', favicon: './company-icons/adform.svg' },
            { id: 'id-many-3', data: 'https://example.com?id=id-many-3', title: 'Adobe', favicon: './company-icons/adobe.svg' },
            { id: 'id-many-4', data: 'https://example.com?id=id-many-4', title: 'Gmail', favicon: './company-icons/google.svg' },
            { id: 'id-many-5', data: 'https://example.com?id=id-many-5', title: 'TikTok', favicon: './company-icons/bytedance.svg' },
            { id: 'id-many-6', data: 'https://example.com?id=id-many-6', title: 'DoorDash', favicon: './company-icons/d.svg' },
            { id: 'id-many-7', data: 'https://example.com?id=id-many-7', title: 'Facebook', favicon: './company-icons/facebook.svg' },
            { id: 'id-many-8', data: 'https://example.com?id=id-many-8', title: 'Beeswax', favicon: './company-icons/beeswax.svg' },
            { id: 'id-many-9', data: 'https://example.com?id=id-many-9', title: 'Adobe', favicon: './company-icons/adobe.svg' },
            { id: 'id-many-10', data: 'https://example.com?id=id-many-10', title: 'Beeswax', favicon: './company-icons/beeswax.svg' },
            { id: 'id-many-11', data: 'https://example.com?id=id-many-11', title: 'Facebook', favicon: './company-icons/facebook.svg' },
            { id: 'id-many-12', data: 'https://example.com?id=id-many-12', title: 'Gmail', favicon: './company-icons/google.svg' },
            { id: 'id-many-13', data: 'https://example.com?id=id-many-13', title: 'TikTok', favicon: './company-icons/bytedance.svg' },
            { id: 'id-many-14', data: 'https://example.com?id=id-many-14', title: 'yeti', favicon: './company-icons/d.svg' }
        ]
    },
    two: {
        /** @type {Favorite[]} */
        favorites: [
            { id: 'id-two-1', data: 'https://example.com?id=id-two-1', title: 'Amazon', favicon: './company-icons/amazon.svg' },
            { id: 'id-two-2', data: 'https://example.com?id=id-two-2', title: 'Adform', favicon: './company-icons/adform.svg' }
        ]
    },
    single: {
        /** @type {Favorite[]} */
        favorites: [
            { id: 'id-single-1', data: 'https://example.com?id=id-single-1', title: 'Amazon', favicon: './company-icons/amazon.svg' }
        ]
    },
    none: {
        /** @type {Favorite[]} */
        favorites: []
    }
}

export function gen (count = 1000) {
    const max = Math.min(count, 1000)
    const icons = [
        '33across.svg',
        'a.svg',
        'acuityads.svg',
        'adform.svg',
        'adjust.svg',
        'adobe.svg',
        'akamai.svg',
        'amazon.svg',
        'amplitude.svg',
        'appsflyer.svg',
        'automattic.svg',
        'b.svg',
        'beeswax.svg',
        'bidtellect.svg',
        'branch-metrics.svg',
        'braze.svg',
        'bugsnag.svg',
        'bytedance.svg',
        'c.svg',
        'chartbeat.svg',
        'cloudflare.svg',
        'cognitiv.svg',
        'comscore.svg',
        'crimtan-holdings.svg',
        'criteo.svg',
        'd.svg',
        'deepintent.svg',
        'e.svg',
        'exoclick.svg',
        'eyeota.svg',
        'f.svg',
        'facebook.svg',
        'g.svg',
        'google.svg',
        'google-ads.svg',
        'google-analytics.svg',
        'gumgum.svg',
        'h.svg',
        'hotjar.svg',
        'i.svg',
        'id5.svg',
        'improve-digital.svg',
        'index-exchange.svg',
        'inmar.svg',
        'instagram.svg',
        'intent-iq.svg',
        'iponweb.svg',
        'j.svg',
        'k.svg',
        'kargo.svg',
        'kochava.svg',
        'l.svg',
        'line.svg',
        'linkedin.svg',
        'liveintent.svg',
        'liveramp.svg',
        'loopme-ltd.svg',
        'lotame-solutions.svg',
        'm.svg',
        'magnite.svg',
        'mediamath.svg',
        'medianet-advertising.svg',
        'mediavine.svg',
        'merkle.svg',
        'microsoft.svg',
        'mixpanel.svg',
        'n.svg',
        'narrative.svg',
        'nativo.svg',
        'neustar.svg',
        'new-relic.svg',
        'o.svg',
        'onetrust.svg',
        'openjs-foundation.svg',
        'openx.svg',
        'opera-software.svg',
        'oracle.svg',
        'other.svg',
        'outbrain.svg',
        'p.svg',
        'pinterest.svg',
        'prospect-one.svg',
        'pubmatic.svg',
        'pulsepoint.svg',
        'q.svg',
        'quantcast.svg',
        'r.svg',
        'rhythmone.svg',
        'roku.svg',
        'rtb-house.svg',
        'rubicon.svg',
        's.svg',
        'salesforce.svg',
        'semasio.svg',
        'sharethrough.svg',
        'simplifi-holdings.svg',
        'smaato.svg',
        'snap.svg',
        'sonobi.svg',
        'sovrn-holdings.svg',
        'spotx.svg',
        'supership.svg',
        'synacor.svg',
        't.svg',
        'taboola.svg',
        'tapad.svg',
        'teads.svg',
        'the-nielsen-company.svg',
        'the-trade-desk.svg',
        'triplelift.svg',
        'twitter.svg',
        'u.svg',
        'unruly-group.svg',
        'urban-airship.svg',
        'v.svg',
        'verizon-media.svg',
        'w.svg',
        'warnermedia.svg',
        'wpp.svg',
        'x.svg',
        'xaxis.svg',
        'y.svg',
        'yahoo-japan.svg',
        'yandex.svg',
        'yieldmo.svg',
        'youtube.svg',
        'z.svg',
        'zeotap.svg',
        'zeta-global.svg'
    ]
    return {
        favorites: Array.from({ length: max }).map((_, index) => {
            const randomFavicon = icons[Math.floor(Math.random() * icons.length)]
            const joined = `./company-icons/${randomFavicon}`
            return {
                id: `id-many-${index}`,
                data: `https://example.com?id=${index}`,
                title: `Example ${index}`,
                favicon: joined
            }
        })

    }
}
