import { useTypedTranslationWith } from '../../types.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { OmniboxProvider } from './OmniboxProvider.js';
import { h } from 'preact';

import { OmniboxConsumer } from './OmniboxConsumer.js';

/**
 * @import enStrings from "../strings.json"
 * @typedef {enStrings} Strings
 */

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function OmniboxCustomized() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    /**
     * The menu title for the omnibox widget.
     */
    const sectionTitle = t('omnibox_menuTitle');

    const { visibility, id, toggle, index } = useVisibility();

    useCustomizer({ title: sectionTitle, id, icon: 'search', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <OmniboxProvider>
            <OmniboxConsumer />
        </OmniboxProvider>
    );
}
