import { useContext, useState } from 'preact/hooks';
import { h, createContext } from 'preact';
import { useEffect } from 'preact/hooks';
import { useMessaging } from '../types';
import { usePlatformName } from './SettingsProvider';
import { useSetFocusMode } from '../components/FocusMode';

export const YOUTUBE_ERROR_EVENT = 'ddg-duckplayer-youtube-error';

/**
 * @typedef {import('../../types/duckplayer').YouTubeError} YouTubeError
 */

/** @type {Record<string,YouTubeError>} */
export const YOUTUBE_ERRORS = {
    ageRestricted: 'age-restricted',
    signInRequired: 'sign-in-required',
    noEmbed: 'no-embed',
    unknown: 'unknown',
};

/** @type {YouTubeError[]} */
export const YOUTUBE_ERROR_IDS = Object.values(YOUTUBE_ERRORS);

const YouTubeErrorContext = createContext({
    /** @type {YouTubeError|null} */
    error: null,
});

/**
 * @param {object} props
 * @param {YouTubeError|null} [props.initial=null]
 * @param {import("preact").ComponentChild} props.children
 */
export function YouTubeErrorProvider({ initial = null, children }) {
    // initial state
    let initialError = null;
    if (initial && YOUTUBE_ERROR_IDS.includes(initial)) {
        initialError = initial;
    }
    const [error, setError] = useState(initialError);

    const messaging = useMessaging();
    const setFocusMode = useSetFocusMode();

    // listen for updates
    useEffect(() => {
        /** @type {(event: CustomEvent) => void} */
        const errorEventHandler = (event) => {
            const eventError = event.detail?.error;
            if (YOUTUBE_ERROR_IDS.includes(eventError) || eventError === null) {
                if (eventError && eventError !== error) {
                    setFocusMode('paused');
                    messaging.reportYouTubeError({ error: eventError });
                } else {
                    setFocusMode('enabled');
                }
                setError(eventError);
            }
        };

        window.addEventListener(YOUTUBE_ERROR_EVENT, errorEventHandler);

        return () => window.removeEventListener(YOUTUBE_ERROR_EVENT, errorEventHandler);
    }, []);

    return <YouTubeErrorContext.Provider value={{ error }}>{children}</YouTubeErrorContext.Provider>;
}

export function useYouTubeError() {
    return useContext(YouTubeErrorContext).error;
}
