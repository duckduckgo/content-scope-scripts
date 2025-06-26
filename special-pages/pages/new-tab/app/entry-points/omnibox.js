import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { OmniboxCustomized } from '../omnibox/components/OmniboxCustomized.js';

export function factory() {
    return (
        <Centered data-entry-point="omnibox">
            <OmniboxCustomized />
        </Centered>
    );
}
