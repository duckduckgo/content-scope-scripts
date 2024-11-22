import { h } from 'preact';
import { WidgetConfigContext, WidgetVisibilityProvider } from './widget-config.provider.js';
import { useContext } from 'preact/hooks';
import { Customizer, CustomizerMenuPositionedFixed } from '../customizer/components/Customizer.js';
import { useMessaging } from '../types.js';
import { ErrorBoundary } from '../../../../shared/components/ErrorBoundary.js';
import { Fallback } from '../../../../shared/components/Fallback/Fallback.jsx';
import { Centered } from '../components/Layout.js';

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
    const messaging = useMessaging();

    /**
     * @param {any} error
     * @param {string} id
     */
    const didCatch = (error, id) => {
        const message = error?.message || error?.error || 'unknown';
        const composed = `Widget '${id}' threw an exception: ` + message;
        messaging.reportPageException({ message: composed });
    };

    return (
        <div>
            {widgets.map((widget, index) => {
                const matchingConfig = widgetConfigItems.find((item) => item.id === widget.id);
                const matchingEntryPoint = entryPoints[widget.id];
                /**
                 * If there's no config, it means the user does not control the visibility of the elements in question.
                 */
                if (!matchingConfig) {
                    return (
                        <ErrorBoundary key={widget.id} didCatch={(error) => didCatch(error, widget.id)} fallback={null}>
                            {matchingEntryPoint.factory?.()}
                        </ErrorBoundary>
                    );
                }

                /**
                 * This section is for elements that the user controls the visibility of
                 */
                return (
                    <WidgetVisibilityProvider key={widget.id} visibility={matchingConfig.visibility} id={matchingConfig.id} index={index}>
                        <ErrorBoundary
                            key={widget.id}
                            didCatch={(error) => didCatch(error, widget.id)}
                            fallback={
                                <Centered>
                                    <Fallback showDetails={true}>Widget id: {matchingConfig.id}</Fallback>
                                </Centered>
                            }
                        >
                            {matchingEntryPoint.factory?.()}
                        </ErrorBoundary>
                    </WidgetVisibilityProvider>
                );
            })}
            <CustomizerMenuPositionedFixed>
                <Customizer />
            </CustomizerMenuPositionedFixed>
        </div>
    );
}
