import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { OmnibarCustomized } from '../omnibar/components/OmnibarCustomized.js';
import { PersistentTermsProvider } from '../omnibar/components/PersistentTermsProvider.js';

export function factory() {
    return (
        <Centered data-entry-point="omnibar">
            <PersistentTermsProvider>
                <OmnibarCustomized />
            </PersistentTermsProvider>
        </Centered>
    );
}
