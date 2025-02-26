import { useEffect } from 'preact/hooks';
import { EVENT_RANGE_CHANGE } from '../../constants.js';
import { useHistoryServiceDispatch } from '../Providers/HistoryServiceProvider.js';

/**
 * A hook that listens to the "range-change" custom event and triggers fetching additional data
 * from the service based on the event's range values.
 */
export function useRangeChange() {
    const dispatch = useHistoryServiceDispatch();
    useEffect(() => {
        function handler(/** @type {CustomEvent<{start: number, end: number}>} */ event) {
            const { end } = event.detail;
            dispatch({ kind: 'request-more', end });
        }

        window.addEventListener(EVENT_RANGE_CHANGE, handler);
        return () => {
            window.removeEventListener(EVENT_RANGE_CHANGE, handler);
        };
    }, []);
}
