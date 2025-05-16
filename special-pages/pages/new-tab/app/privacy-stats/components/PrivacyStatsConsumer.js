import { useContext } from 'preact/hooks';
import { PrivacyStatsContext } from './PrivacyStatsProvider.js';
import { h } from 'preact';
import { PrivacyStatsBody } from './PrivacyStats.js';
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
    const { state } = useContext(PrivacyStatsContext);
    const secondaryExpansion = useBodyExpansion();
    if (state.status === 'ready') {
        return <PrivacyStatsBody expansion={secondaryExpansion} trackerCompanies={state.data.trackerCompanies} id={'anything'} />;
    }
    return null;
}
