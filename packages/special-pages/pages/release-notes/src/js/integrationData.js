/**
* @type {Record<'loading'|'loaded'|'updateReady', import('../../../../types/release-notes').UpdateMessage>}
*/
export const integrationData = {
    loading: {
        status: "loading",
        currentVersion: "1.0.1",
        lastUpdate: Date.now(),
    },
    loaded: {
        currentVersion: "1.0.1",
        latestVersion: "1.0.1",
        lastUpdate: Date.now(),
        status: "loaded",
        releaseTitle: "May 20 2024",
        releaseNotes: [
            "Startup Boost Enabled! DuckDuckGo will now run a background task whenever you startup your computer to help it launch faster.",
            "Fixed an issue where Microsoft Teams links wouldn't open the Teams app.",
            "Improved credential autofill on websites in Dutch, French, German, Italian, Spanish, and Swedish."
        ],
        releaseNotesPrivacyPro: [
            "Personal Information Removal update! The list of data broker sites we can scan and remove your info from is growing.",
            "Privacy Pro is currently available to U.S. residents only"
        ]
    },
    updateReady: {
        currentVersion: "1.0.1",
        latestVersion: "1.2.0",
        lastUpdate: Date.now(),
        status: "updateReady",
        releaseTitle: "June 20 2024",
        releaseNotes: [
            "Startup Boost Enabled! DuckDuckGo will now run a background task whenever you startup your computer to help it launch faster.",
            "Fixed an issue where Microsoft Teams links wouldn't open the Teams app.",
            "Improved credential autofill on websites in Dutch, French, German, Italian, Spanish, and Swedish."
        ],
        releaseNotesPrivacyPro: [
            "Personal Information Removal update! The list of data broker sites we can scan and remove your info from is growing.",
            "Privacy Pro is currently available to U.S. residents only"
        ]
    }
}
