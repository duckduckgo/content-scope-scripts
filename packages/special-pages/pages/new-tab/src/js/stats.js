export class Stats {
    /**
     * @param {import("./index.js").NewTabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp
    }

    /**
     * @returns {Promise<import("../../../../types/new-tab.js").PrivacyStats>}
     */
    getPrivacyStats() {
        return Promise.resolve({
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
            trackerCompaniesPeriod: 'last-day',
            expansion: "visible"
        })
    }
}
