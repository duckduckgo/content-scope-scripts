import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { PrivacyStatsCustomized } from '../privacy-stats/components/PrivacyStatsCustomized.js';

export function factory() {
    return (
        <Centered data-entry-point="privacyStats">
            <PrivacyStatsCustomized />
        </Centered>
    );
}
