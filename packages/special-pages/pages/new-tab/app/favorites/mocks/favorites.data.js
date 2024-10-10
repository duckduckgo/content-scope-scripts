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
            { id: 'id-many-1', data: 'https://1.example.com', title: 'Amazon', favicon: './company-icons/amazon.svg' },
            { id: 'id-many-2', data: 'https://2.example.com', title: 'Adform', favicon: './company-icons/adform.svg' },
            { id: 'id-many-3', data: 'https://3.example.com', title: 'Adobe', favicon: './company-icons/adobe.svg' },
            { id: 'id-many-4', data: 'https://4.example.com', title: 'Gmail', favicon: './company-icons/google.svg' },
            { id: 'id-many-5', data: 'https://5.example.com', title: 'TikTok', favicon: './company-icons/bytedance.svg' },
            { id: 'id-many-6', data: 'https://6.example.com', title: 'yeti', favicon: './company-icons/d.svg' },
            { id: 'id-many-7', data: 'https://7.example.com', title: 'Facebook', favicon: './company-icons/facebook.svg' },
            { id: 'id-many-8', data: 'https://8.example.com', title: 'Beeswax', favicon: './company-icons/beeswax.svg' },
            { id: 'id-many-9', data: 'https://9.example.com', title: 'Adobe', favicon: './company-icons/adobe.svg' },
            { id: 'id-many-10', data: 'https://10.example.com', title: 'Beeswax', favicon: './company-icons/beeswax.svg' },
            { id: 'id-many-11', data: 'https://11.example.com', title: 'Facebook', favicon: './company-icons/facebook.svg' },
            { id: 'id-many-12', data: 'https://12.example.com', title: 'Gmail', favicon: './company-icons/google.svg' },
            { id: 'id-many-13', data: 'https://13.example.com', title: 'TikTok', favicon: './company-icons/bytedance.svg' },
            { id: 'id-many-14', data: 'https://14.example.com', title: 'yeti', favicon: './company-icons/d.svg' }
        ]
    },
    two: {
        /** @type {Favorite[]} */
        favorites: [
            { id: 'id-two-1', data: 'https://1.example.com', title: 'Amazon', favicon: './company-icons/amazon.svg' },
            { id: 'id-two-2', data: 'https://2.example.com', title: 'Adform', favicon: './company-icons/adform.svg' }
        ]
    },
    single: {
        /** @type {Favorite[]} */
        favorites: [
            { id: 'id-single-1', data: 'https://1.example.com', title: 'Amazon', favicon: './company-icons/amazon.svg' }
        ]
    },
    none: {
        /** @type {Favorite[]} */
        favorites: []
    }
}
