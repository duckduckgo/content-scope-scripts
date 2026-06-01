import { useCallback, useContext, useEffect, useState } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';

/**
 * @typedef {import('../../../../../types/new-tab.js').TabMetadata} TabMetadata
 */

/**
 * @param {object} options
 * @param {boolean} options.active — When false, no fetch is triggered.
 * @returns {{ tabs: TabMetadata[], refresh: () => void }}
 */
export function useOpenTabs({ active }) {
    const { getOpenTabs } = useContext(OmnibarContext);
    const [tabs, setTabs] = useState(/** @type {TabMetadata[]} */ ([]));

    const fetchTabs = useCallback(async () => {
        try {
            const response = await getOpenTabs();
            setTabs(response.tabs ?? []);
        } catch (err) {
            console.error('omnibar_getOpenTabs failed', err);
        }
    }, [getOpenTabs]);

    useEffect(() => {
        if (!active) return;
        fetchTabs();
    }, [active, fetchTabs]);

    return { tabs, refresh: fetchTabs };
}
