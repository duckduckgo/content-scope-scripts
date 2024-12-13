import { h } from 'preact';
import { PrivacyProCustomized } from '../privacy-pro/components/PrivacyPro.js';
import { Centered } from '../components/Layout.js';

export function factory() {
    return (
        <Centered data-entry-point="privacyPro">
            <PrivacyProCustomized />
        </Centered>
    );
}
