import { useState, useEffect } from 'preact/hooks';

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 *
 * @param {string} query - A CSS media query string, e.g. '(max-height: 549px)'
 * @returns {boolean}
 */
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

    useEffect(() => {
        const mql = window.matchMedia(query);
        setMatches(mql.matches);
        const handler = () => setMatches(mql.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}
