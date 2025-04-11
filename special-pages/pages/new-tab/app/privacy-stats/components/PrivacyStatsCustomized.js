import { useTypedTranslationWith } from '../../types.js';
import { useAdBlocking, useCustomizerDrawerSettings } from '../../settings.provider.js';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { PrivacyStatsProvider } from './PrivacyStatsProvider.js';
import { h } from 'preact';

import { PrivacyStatsConsumer } from './PrivacyStatsConsumer.js';
import { BodyExpanderProvider } from './BodyExpansionProvider.js';

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
export function PrivacyStatsCustomized() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const drawer = useCustomizerDrawerSettings();
    const adBlocking = useAdBlocking();

    /**
     * The menu title for the stats widget is changes when the menu is in the sidebar.
     */
    // prettier-ignore
    const sectionTitle = drawer.state === 'enabled' || adBlocking
            ? t('stats_menuTitle_v2')
            : t('stats_menuTitle');

    const { visibility, id, toggle, index } = useVisibility();

    useCustomizer({ title: sectionTitle, id, icon: 'shield', toggle, visibility: visibility.value, index });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <PrivacyStatsProvider>
            <BodyExpanderProvider>
                <PrivacyStatsConsumer />
            </BodyExpanderProvider>
        </PrivacyStatsProvider>
    );
}
