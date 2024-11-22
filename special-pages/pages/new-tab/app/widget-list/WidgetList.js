import { Fragment, h } from 'preact';
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js';
import { useContext } from 'preact/hooks';
import { Customizer, CustomizerMenuPositionedFixed } from '../customizer/components/Customizer';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';
import { DebugCustomized } from '../telemetry/Debug.js';

/**
 * @param {string} id
 * @return {{factory: () => import("preact").ComponentChild}}
 */
function placeholderWidget(id) {
    return {
        factory: () => {
            return <p>Entry point for {id} was not found. This is a bug.</p>;
        },
    };
}

/**
 * @param {string} id
 * @return {Promise<{factory: () => import("preact").ComponentChild}>}
 */
export async function widgetEntryPoint(id) {
    try {
        const mod = await import(`../entry-points/${id}.js`);
        if (typeof mod.factory !== 'function') {
            console.error(`module found for ${id}, but missing 'factory' export`);
            return placeholderWidget(id);
        }
        return mod;
    } catch (e) {
        console.error(e);
        return placeholderWidget(id);
    }
}

export function WidgetList() {
    const { widgets, widgetConfigItems, entryPoints } = useContext(WidgetConfigContext);
    const { env } = useEnv();

    return (
        <div>
            {widgets.map((widget, index) => {
                const matchingConfig = widgetConfigItems.find((item) => item.id === widget.id);
                const matchingEntryPoint = entryPoints[widget.id];
                if (!matchingConfig) {
                    return <Fragment key={widget.id}>{matchingEntryPoint.factory?.()}</Fragment>;
                }
                return (
                    <Fragment key={widget.id}>
                        <WidgetVisibilityProvider visibility={matchingConfig.visibility} id={matchingConfig.id} index={index}>
                            {matchingEntryPoint.factory?.()}
                        </WidgetVisibilityProvider>
                    </Fragment>
                );
            })}
            {env === 'development' && <DebugCustomized index={widgets.length} />}
            <CustomizerMenuPositionedFixed>
                <Customizer />
            </CustomizerMenuPositionedFixed>
        </div>
    );
}
