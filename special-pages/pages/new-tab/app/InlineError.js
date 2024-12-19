import { h } from 'preact';
import { ErrorBoundary } from '../../../shared/components/ErrorBoundary.js';
import { useMessaging } from './types.js';

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {string} props.named
 * @param {(message: string) => import("preact").ComponentChild} [props.fallback]
 */
export function InlineError({ children, named, fallback }) {
    const messaging = useMessaging();
    /**
     * @param {any} error
     * @param {string} id
     */
    const didCatch = (error, id) => {
        const message = error?.message || error?.error || 'unknown';
        const composed = `Customizer section '${id}' threw an exception: ` + message;
        messaging.reportPageException({ message: composed });
    };
    const inlineMessage = 'A problem occurred with this feature. DuckDuckGo was notified';
    const fallbackElement = fallback?.(inlineMessage) || <p>{inlineMessage}</p>;
    return (
        <ErrorBoundary didCatch={(error) => didCatch(error, named)} fallback={fallbackElement}>
            {children}
        </ErrorBoundary>
    );
}
