import { createContext, h } from 'preact'
import { stats } from '../data.js'
import { useMessaging } from "../types.js";

export const TrackerStatsContext = createContext({
    data: /** @type {any} */(null)
})

/**
 * A provider used in storybook: it just returns a static set of
 * data + a toggle function
 *
 * @param {Object} props - The props object containing the data.
 * @param {import("preact").ComponentChild} props.children - The children elements to be rendered.
 * @param {import("preact").ComponentChild} props.children - The children elements to be rendered.
 *
 */
export function TrackerStatsProvider (props) {
    const {messaging} = useMessaging();
    // messaging.stats.getPrivacyStats()
    const url = new URL(window.location.href)
    const key = url.searchParams.get('stats') || 'few'
    const trackerStats = stats[key] || stats.few

    return (
        <TrackerStatsContext.Provider value={{ data: trackerStats }}>
            {props.children}
        </TrackerStatsContext.Provider>
    )
}
