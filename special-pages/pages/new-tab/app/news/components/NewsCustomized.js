import { h } from 'preact';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { NewsProvider } from './NewsProvider.js';
import { NewsConsumer } from './NewsConsumer.js';

/**
 * Render the news widget, with integration into the page customizer
 */
export function NewsCustomized() {
    const { id, visibility, toggle, index } = useVisibility();

    // register with the visibility menu
    const title = 'News';
    useCustomizer({ title, id, icon: null, toggle, visibility: visibility.value, index, enabled: true });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <NewsProvider>
            <NewsConsumer />
        </NewsProvider>
    );
}
