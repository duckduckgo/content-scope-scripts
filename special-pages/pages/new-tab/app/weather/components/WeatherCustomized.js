import { h } from 'preact';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { WeatherProvider } from './WeatherProvider.js';
import { WeatherConsumer } from './WeatherConsumer.js';

/**
 * Render the weather widget, with integration into the page customizer
 */
export function WeatherCustomized() {
    const { id, visibility, toggle, index } = useVisibility();

    // register with the visibility menu
    const title = 'Weather';
    useCustomizer({ title, id, icon: null, toggle, visibility: visibility.value, index, enabled: true });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <WeatherProvider>
            <WeatherConsumer />
        </WeatherProvider>
    );
}
