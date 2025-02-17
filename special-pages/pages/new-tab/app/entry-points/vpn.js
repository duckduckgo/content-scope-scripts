import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { VpnCustomized } from '../vpn/Vpn.js';
export function factory() {
    return (
        <Centered data-entry-point="vpn">
            <VpnCustomized />
        </Centered>
    );
}
