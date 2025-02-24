import { useContext } from 'preact/hooks';
import { PrivacyStatsContext } from './PrivacyStatsProvider.js';
import { h } from 'preact';
import { PrivacyStats } from './PrivacyStats.js';
import { useBodyExpansion } from './BodyExpansionProvider.js';

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <PrivacyStatsProvider>
 *     <BodyExpanderProvider>
 *        <PrivacyStatsConsumer />
 *     </BodyExpanderProvider
 * </PrivacyStatsProvider>
 * ```
 */
export function PrivacyStatsConsumer() {
    const { state, toggle } = useContext(PrivacyStatsContext);
    const secondaryExpansion = useBodyExpansion();
    if (state.status === 'ready') {
        return (
            <PrivacyStats expansion={state.config.expansion} secondaryExpansion={secondaryExpansion} data={state.data} toggle={toggle} />
        );
    }
    return null;
}
