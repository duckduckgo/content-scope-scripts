import { createContext, h } from 'preact'

export const TrackerStatsContext = createContext({
    data: /** @type {any} */(null)
})

/**
 * A provider used in storybook: it just returns a static set of
 * data + a toggle function
 *
 * @param {Object} props - The props object containing the data.
 * @param {any} props.data - The static set of data.
 * @param {import("preact").ComponentChild} props.children - The children elements to be rendered.
 *
 */
export function TrackerStatsProvider (props) {
    // todo: subscribe to update here?
    return (
        <TrackerStatsContext.Provider value={{ data: props.data }}>
            {props.children}
        </TrackerStatsContext.Provider>
    )
}
