import { Fragment, h } from 'preact';
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js';
import { useContext } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary.js';
import { Centered, VerticalSpace } from '../components/Layout.js';
import { INLINE_ERROR } from '../InlineErrorBoundary.js';

/**
 * @param {string} id
 * @return {{factory: () => import("preact").ComponentChild}}
 */
function placeholderWidget(id) {
    return {
        factory: () => {
            return null;
        },
    };
}

/**
 * Note: This is a temporary work-around for the esbuild target of safari11 not allowing dynamic imports
 * @type {Record<string, () => {factory: () => import("preact").ComponentChild}>}
 */
const lazyLookup = {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
    favorites: () => require('../entry-points/favorites.js'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
    freemiumPIRBanner: () => require('../entry-points/freemiumPIRBanner.js'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
    nextSteps: () => require('../entry-points/nextSteps.js'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
    privacyStats: () => require('../entry-points/privacyStats.js'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
    rmf: () => require('../entry-points/rmf.js'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports,no-undef
    updateNotification: () => require('../entry-points/updateNotification.js'),
};
/**
 * @param {string} id
 * @param {(message: string) => void} didCatch
 * @return {{factory: () => import("preact").ComponentChild}}
 */
export function widgetEntryPoint(id, didCatch) {
    try {
        const mod = lazyLookup[id]?.();
        if (typeof mod.factory !== 'function') {
            console.error(`module found for ${id}, but missing 'factory' export`);
            return placeholderWidget(id);
        }
        return mod;
    } catch (e) {
        console.error(e);
        didCatch(e.toString());
        return placeholderWidget(id);
    }
}

export function WidgetList() {
    const { widgets, widgetConfigItems, entryPoints } = useContext(WidgetConfigContext);
    const messaging = useMessaging();

    /**
     * @param {string} message
     * @param {string} id
     */
    const didCatch = (message, id) => {
        const composed = `Widget '${id}' threw an exception: ` + message;
        messaging.reportPageException({ message: composed });
    };

    return (
        <Fragment>
            {widgets.map((widget, index) => {
                const isUserConfigurable = widgetConfigItems.find((item) => item.id === widget.id);
                const matchingEntryPoint = entryPoints[widget.id];
                /**
                 * If there's no config, it means the user does not control the visibility of the elements in question.
                 */
                if (!isUserConfigurable) {
                    return (
                        <ErrorBoundary key={widget.id} didCatch={({ message }) => didCatch(message, widget.id)} fallback={null}>
                            <WidgetLoader fn={matchingEntryPoint.factory} />
                        </ErrorBoundary>
                    );
                }

                /**
                 * This section is for elements that the user controls the visibility of
                 */
                return (
                    <WidgetVisibilityProvider key={widget.id} id={widget.id} index={index}>
                        <ErrorBoundary
                            key={widget.id}
                            didCatch={({ message }) => didCatch(message, widget.id)}
                            fallback={
                                <Centered data-entry-point={widget.id}>
                                    <VerticalSpace>
                                        <p>{INLINE_ERROR}</p>
                                        <p>Widget ID: {widget.id}</p>
                                    </VerticalSpace>
                                </Centered>
                            }
                        >
                            <WidgetLoader fn={matchingEntryPoint.factory} />
                        </ErrorBoundary>
                    </WidgetVisibilityProvider>
                );
            })}
        </Fragment>
    );
}

/**
 * This defers the call to `.factory`, which would otherwise not be caught
 * by the error boundaries.
 *
 * @param {object} props
 * @return {any}
 */
function WidgetLoader({ fn }) {
    const result = fn?.();
    return result;
}
