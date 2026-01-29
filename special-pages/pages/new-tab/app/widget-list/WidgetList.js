import { Fragment, h } from 'preact';
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js';
import { useContext } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary.js';
import { Centered, VerticalSpace } from '../components/Layout.js';
import { INLINE_ERROR } from '../InlineErrorBoundary.js';
import { DebugCustomized } from '../telemetry/Debug.js';
import { useEnv } from '../../../../shared/components/EnvironmentProvider.js';

/**
 * @return {{factory: (instanceId?: string) => import("preact").ComponentChild}}
 */
function placeholderWidget() {
    return {
        factory: () => {
            return null;
        },
    };
}

/**
 * @param {string} id
 * @param {(message: string) => void} didCatch
 * @return {Promise<{factory: (instanceId?: string) => import("preact").ComponentChild}>}
 */
export async function widgetEntryPoint(id, didCatch) {
    try {
        const mod = await import(`../entry-points/${id}.js`);
        if (typeof mod.factory !== 'function') {
            console.error(`module found for ${id}, but missing 'factory' export`);
            return placeholderWidget();
        }
        return mod;
    } catch (e) {
        console.error(e);
        didCatch(e.toString());
        return placeholderWidget();
    }
}

export function WidgetList() {
    const { widgets, currentValues, entryPoints } = useContext(WidgetConfigContext);
    const messaging = useMessaging();
    const { env } = useEnv();

    /**
     * @param {string} message
     * @param {string} id
     */
    const didCatch = (message, id) => {
        const composed = `Widget '${id}' threw an exception: ` + message;
        messaging.reportPageException({ message: composed });
    };

    // Filter non-configurable widgets (like rmf, updateNotification) from the widgets array
    const nonConfigurableWidgets = widgets.filter((widget) => {
        const hasConfig = currentValues.value.some((config) => config.id === widget.id);
        return !hasConfig;
    });

    return (
        <Fragment>
            {/* Render non-configurable widgets first (e.g., rmf, updateNotification) */}
            {nonConfigurableWidgets.map((widget) => {
                const matchingEntryPoint = entryPoints[widget.id];
                if (!matchingEntryPoint) return null;
                return (
                    <ErrorBoundary key={widget.id} didCatch={({ message }) => didCatch(message, widget.id)} fallback={null}>
                        <WidgetLoader fn={matchingEntryPoint.factory} />
                    </ErrorBoundary>
                );
            })}

            {/* Render configurable widgets based on currentValues order */}
            {currentValues.value.map((config, index) => {
                const matchingEntryPoint = entryPoints[config.id];
                if (!matchingEntryPoint) return null;

                // Use instanceId as key for multi-instance widgets, otherwise use id
                const key = 'instanceId' in config && config.instanceId ? config.instanceId : config.id;
                const instanceId = 'instanceId' in config ? config.instanceId : undefined;

                return (
                    <WidgetVisibilityProvider key={key} id={config.id} instanceId={instanceId} index={index}>
                        <ErrorBoundary
                            didCatch={({ message }) => didCatch(message, config.id)}
                            fallback={
                                <Centered data-entry-point={config.id}>
                                    <VerticalSpace>
                                        <p>{INLINE_ERROR}</p>
                                        <p>Widget ID: {config.id}</p>
                                    </VerticalSpace>
                                </Centered>
                            }
                        >
                            <WidgetLoader fn={matchingEntryPoint.factory} instanceId={instanceId} />
                        </ErrorBoundary>
                    </WidgetVisibilityProvider>
                );
            })}

            {env === 'development' && (
                <Centered data-entry-point="debug">
                    <DebugCustomized index={widgets.length} isOpenInitially={window.location.search.includes('debugWidget')} />
                </Centered>
            )}
        </Fragment>
    );
}

/**
 * This defers the call to `.factory`, which would otherwise not be caught
 * by the error boundaries.
 *
 * @param {object} props
 * @param {((instanceId?: string) => import("preact").ComponentChild) | undefined} props.fn
 * @param {string} [props.instanceId]
 * @return {any}
 */
function WidgetLoader({ fn, instanceId }) {
    const result = fn?.(instanceId);
    return result;
}
