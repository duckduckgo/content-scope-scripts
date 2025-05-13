import { useContext } from 'preact/hooks';
import { ProtectionsContext } from './ProtectionsProvider.js';
import { h } from 'preact';
import { Protections } from './Protections.js';

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <ProtectionsProvider>
 *     <BodyExpanderProvider>
 *        <ProtectionsConsumer />
 *     </BodyExpanderProvider
 * </ProtectionsProvider>
 * ```
 */
export function ProtectionsConsumer() {
    const { state, toggle, setFeed } = useContext(ProtectionsContext);
    if (state.status === 'ready') {
        return (
            <Protections expansion={state.config.expansion} data={state.data} toggle={toggle} feed={state.config.feed} setFeed={setFeed} />
        );
    }
    return null;
}
