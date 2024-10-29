import { Fragment, h } from 'preact'
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js'
import { useContext } from 'preact/hooks'
import { PrivacyStatsCustomized } from '../privacy-stats/PrivacyStats.js'
import { FavoritesCustomized } from '../favorites/Favorites.js'
import { Stack } from '../../../onboarding/app/components/Stack.js'
import {
    Customizer,
    CustomizerMenuPositionedFixed
} from '../customizer/Customizer.js'
import { RMFProvider } from '../remote-messaging-framework/RMFProvider.js'
import { RMFConsumer } from '../remote-messaging-framework/RemoteMessagingFramework.js'
import { UpdateNotificationProvider } from '../update-notification/UpdateNotificationProvider.js'
import { UpdateNotificationConsumer } from '../update-notification/UpdateNotification.js'

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
    ),
    updateNotification: () => (
        <UpdateNotificationProvider>
            <UpdateNotificationConsumer />
        </UpdateNotificationProvider>
    )
}

export function WidgetList () {
    const { widgets, widgetConfigItems } = useContext(WidgetConfigContext)

    return (
        <Stack gap={'var(--sp-8)'}>
            {widgets.map((widget, index) => {
                const matchingConfig = widgetConfigItems.find(item => item.id === widget.id)
                if (!matchingConfig) {
                    const matching = widgetMap[widget.id]
                    if (matching) {
                        return (
                            <Fragment key={widget.id}>
                                {matching?.()}
                            </Fragment>
                        )
                    }
                    console.warn('missing component for widget id:', widget)
                    return null
                }
                return (
                    <Fragment key={widget.id}>
                        <WidgetVisibilityProvider
                            visibility={matchingConfig.visibility}
                            id={matchingConfig.id}
                            index={index}
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
