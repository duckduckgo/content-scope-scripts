import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { NewsCustomized } from '../news/components/NewsCustomized.js';

/**
 * @param {string} [instanceId]
 */
export function factory(instanceId) {
    return (
        <Centered data-entry-point="news" data-instance-id={instanceId}>
            <NewsCustomized instanceId={instanceId} />
        </Centered>
    );
}
