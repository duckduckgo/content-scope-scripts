import { Fragment, h } from 'preact'
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js'
import { useContext } from 'preact/hooks'
import { PrivacyStatsCustomized } from '../privacy-stats/PrivacyStats.js'
import { FavoritesCustomized } from '../favorites/Favorites.js'
import { Stack } from '../../../onboarding/app/components/Stack.js'
import { Customizer } from '../customizer/Customizer.js'
import { RMFProvider } from '../remote-messaging-framework/RMFProvider.js'
import { RMFConsumer } from '../remote-messaging-framework/RemoteMessagingFramework.js'

const widgetMap = {
    privacyStats: () => (
        <PrivacyStatsCustomized />
    ),
    favorites: () => (
        <FavoritesCustomized />
    ),
    rmf: () => (
        <RMFProvider>
            <RMFConsumer />
        </RMFProvider>
    )
}

export function WidgetList () {
    const { widgets, widgetConfigItems } = useContext(WidgetConfigContext)

    return (
        <Stack gap={'var(--sp-8)'}>
            {widgets.map((widget) => {
                const matchingConfig = widgetConfigItems.find(item => item.id === widget.id)
                if (!matchingConfig) {
                    console.warn('missing config for widget: ', widget)
                    return null
                }
                return (
                    <Fragment key={widget.id}>
                        <WidgetVisibilityProvider
                            visibility={matchingConfig.visibility}
                            id={matchingConfig.id}
                        >
                            {widgetMap[widget.id]?.()}
                        </WidgetVisibilityProvider>
                    </Fragment>
                )
            })}
            <CustomizerMenuPositionedFixed>
                <Customizer />
            </CustomizerMenuPositionedFixed>
        </Stack>
    )
}
