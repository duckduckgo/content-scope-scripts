import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { StockCustomized } from '../stock/components/StockCustomized.js';

/**
 * @param {string} [instanceId]
 */
export function factory(instanceId) {
    return (
        <Centered data-entry-point="stock" data-instance-id={instanceId}>
            <StockCustomized instanceId={instanceId} />
        </Centered>
    );
}
