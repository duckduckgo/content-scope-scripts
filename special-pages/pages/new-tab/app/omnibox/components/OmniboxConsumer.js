import { useContext } from 'preact/hooks';
import { OmniboxContext } from './OmniboxProvider.js';
import { h } from 'preact';
import { Omnibox } from './Omnibox.js';

/**
 * @typedef {import('../../../types/new-tab.js').OmniboxConfig} OmniboxConfig
 */

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <OmniboxProvider>
 *   <OmniboxConsumer />
 * </OmniboxProvider>
 * ```
 */
export function OmniboxConsumer() {
    const { state } = useContext(OmniboxContext);
    if (state.status === 'ready') {
        return <OmniboxReadyState config={state.config} />;
    }
    return null;
}

/**
 * @param {object} props
 * @param {OmniboxConfig} props.config
 */
function OmniboxReadyState({ config }) {
    const { setMode, getSuggestions, openSuggestion, submitSearch, submitChat } = useContext(OmniboxContext);

    return (
        <Omnibox
            mode={config.mode}
            setMode={setMode}
            getSuggestions={getSuggestions}
            openSuggestion={openSuggestion}
            submitSearch={submitSearch}
            submitChat={submitChat}
        />
    );
}
