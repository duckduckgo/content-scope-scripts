const circleSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" stroke="red" stroke-width="3" fill="transparent" /></svg>'
export const favicon = `data:image/svg+xml,${encodeURIComponent(circleSVG)}`

export const favorites = [
    {
        id: 1,
        title: 'Amazon',
        favicon,
        href: 'https://1.example.com'
    },
    {
        id: 2,
        title: 'Airbnb',
        favicon,
        href: 'https://2.example.com'
    },
    {
        id: 3,
        title: 'Google',
        favicon,
        href: 'https://3.example.com'
    },
    {
        id: 4,
        title: 'Facebook',
        favicon,
        href: 'https://4.example.com'
    },
    {
        id: 5,
        title: 'Twitter',
        favicon,
        href: 'https://5.example.com'
    },
    {
        id: 6,
        title: 'LinkedIn',
        favicon,
        href: 'https://6.example.com'
    },
    {
        id: 7,
        title: 'YouTube',
        favicon,
        href: 'https://7.example.com'
    },
    {
        id: 8,
        title: 'Instagram',
        favicon,
        href: 'https://8.example.com'
    },
    {
        id: 9,
        title: 'Pinterest',
        favicon,
        href: 'https://9.example.com'
    },
    {
        id: 10,
        title: 'Reddit',
        favicon,
        href: 'https://10.example.com'
    },
    {
        id: 11,
        title: 'Medium',
        favicon,
        href: 'https://11.example.com'
    }
]

export const stats = {
    few: {
        totalCount: 48_1113,
        trackerCompanies: [
            {
                displayName: 'Facebook',
                count: 310
            },
            {
                displayName: 'Google',
                count: 279
            },
            {
                displayName: 'Other',
                count: 210
            }
        ],
        trackerCompaniesPeriod: 'last-day'
    },
    single: {
        totalCount: 48_1113,
        trackerCompanies: [
            {
                displayName: 'Google',
                count: 1
            }
        ],
        trackerCompaniesPeriod: 'last-day'
    },
    norecent: {
        totalCount: 48_1113,
        trackerCompanies: [],
        trackerCompaniesPeriod: 'last-day'
    },
    none: {
        totalCount: 0,
        trackerCompanies: [],
        trackerCompaniesPeriod: 'last-day'
    }
}
