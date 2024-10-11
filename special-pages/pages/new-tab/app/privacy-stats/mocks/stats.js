// todo: add schema for types here.
export const stats = {
    few: {
        totalCount: 481_113,
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
                displayName: 'Amazon',
                count: 67
            },
            {
                displayName: 'Google Ads',
                count: 2
            },
            {
                displayName: 'Other',
                count: 210
            }
        ],
        trackerCompaniesPeriod: 'last-day'
    },
    single: {
        totalCount: 481_113,
        trackerCompanies: [
            {
                displayName: 'Google',
                count: 1
            }
        ],
        trackerCompaniesPeriod: 'last-day'
    },
    norecent: {
        totalCount: 481_113,
        trackerCompanies: [],
        trackerCompaniesPeriod: 'last-day'
    },
    none: {
        totalCount: 0,
        trackerCompanies: [],
        trackerCompaniesPeriod: 'last-day'
    }
}
