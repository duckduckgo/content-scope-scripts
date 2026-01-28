import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { NewsContext } from './NewsProvider.js';
import { News } from './News.js';

/**
 * Component that consumes NewsContext for displaying news data.
 */
export function NewsConsumer() {
    const { state } = useContext(NewsContext);

    if (state.status === 'ready') {
        return <News data={state.data} />;
    }

    return null;
}
