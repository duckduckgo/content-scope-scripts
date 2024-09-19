import { h, Fragment } from 'preact'
import { Stack } from '../../../../shared/components/Stack'
import { LayoutContext } from '../providers/layout.provider.js'
import { useContext } from 'preact/hooks'
import { Favorites } from './Favourites.js'
import { TrackerStatsProvider } from '../providers/tracker-stats.provider.js'
import { TrackerStats } from './TrackerStats.js'
import { VisibilityProvider } from "../providers/visibility.provider.js";

const widgetMap = {
    Favorites: () => <Favorites />,
    PrivacyStats: () => (
        <TrackerStatsProvider>
            <TrackerStats />
        </TrackerStatsProvider>
    )
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} [props.children]
 */
export function WidgetList ({ children }) {
    const { widgets } = useContext(LayoutContext)
    console.log('will map', widgets)
    return (
        <Stack gap={'var(--sp-7)'}>
            {widgets.map((w) => {
                return (
                    <Fragment key={w.widgetName}>
                        <VisibilityProvider state={w}>
                            {widgetMap[w.widgetName]?.()}
                        </VisibilityProvider>
                    </Fragment>
                )
            })}
        </Stack>
    )
}
