import { useContext, useState } from 'preact/hooks';
import { h, createContext } from 'preact';
import { useEffect } from 'preact/hooks';

export const IFRAME_ERROR_EVENT = 'iframe-error';

/**
 * @typedef {import("../components/Player").PlayerError} PlayerError
 */

const YouTubeErrorContext = createContext({
    /** @type {PlayerError|null} */
    error: null,
});

/**
 * @param {object} props
 * @param {PlayerError|null} [props.initial=null]
 * @param {import("preact").ComponentChild} props.children
 */
export function YouTubeErrorProvider({ initial = null, children }) {
    // initial state
    const [error, setError] = useState(initial);

    // listen for updates
    useEffect(() => {
        /** @type {(event: CustomEvent) => void} */
        const errorEventHandler = (event) => {
            if (event.detail) {
                setError(event.detail.error || null);
            }
        };

        window.addEventListener(IFRAME_ERROR_EVENT, errorEventHandler);

        return () => window.removeEventListener(IFRAME_ERROR_EVENT, errorEventHandler);
    }, []);

    return <YouTubeErrorContext.Provider value={{ error }}>{children}</YouTubeErrorContext.Provider>;
}

export function useYouTubeError() {
    return useContext(YouTubeErrorContext).error;
}
