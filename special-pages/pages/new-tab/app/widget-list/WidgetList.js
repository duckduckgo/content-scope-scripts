import { Fragment, h } from 'preact'
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js'
import { useContext } from 'preact/hooks'
import { Stack } from '../../../onboarding/app/components/Stack.js'
import {
    Customizer,
    CustomizerMenuPositionedFixed
} from '../customizer/Customizer.js'
import { DebugCustomized } from '../telemetry/Debug.js'
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js'

/**
 * @param {string} id
 * @return {{factory: () => import("preact").ComponentChild}}
 */
function placeholderWidget (id) {
    return {
        factory: () => {
            return <p>Entry point for {id} was not found. This is a bug.</p>
        }
    }
}

/**
 * @param {string} id
 * @return {{factory: () => import("preact").ComponentChild}}
 */
function widgetEntryPoint (id) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(`./entry-points/${id}.js`)
        if (typeof mod.factory !== 'function') {
            console.error(`module found for ${id}, but missing 'factory' export`)
            return placeholderWidget(id)
        }
        return mod
    } catch (e) {
        console.error(e)
        return placeholderWidget(id)
    }
};

export function WidgetList () {
    const { widgets, widgetConfigItems } = useContext(WidgetConfigContext)
    const { env } = useEnv()

    return (
        <Stack gap={'var(--sp-8)'}>
            {widgets.map((widget, index) => {
                const matchingConfig = widgetConfigItems.find(item => item.id === widget.id)
                const matchingEntryPoint = widgetEntryPoint(widget.id)
                if (!matchingConfig) {
                    return (
                        <Fragment key={widget.id}>
                            {matchingEntryPoint.factory?.()}
                        </Fragment>
                    )
                }
                return (
                    <Fragment key={widget.id}>
                        <WidgetVisibilityProvider
                            visibility={matchingConfig.visibility}
                            id={matchingConfig.id}
                            index={index}
                        >
                            {matchingEntryPoint.factory?.()}
                        </WidgetVisibilityProvider>
                    </Fragment>
                )
            })}
            {env === 'development' && (
                <DebugCustomized index={widgets.length} />
            )}
            <CustomizerMenuPositionedFixed>
                <Customizer />
            </CustomizerMenuPositionedFixed>
        </Stack>
    )
}
