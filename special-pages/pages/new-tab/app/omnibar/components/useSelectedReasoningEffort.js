import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import { useSelectedModel } from './useSelectedModel';

export function useSelectedReasoningEffort() {
    const { state, setSelectedReasoningEffort } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();

    const supportedEfforts = selectedModel?.supportedReasoningEffort ?? [];
    const persisted = state.config?.selectedReasoningEffort;
    const isPersistedSupported = persisted && supportedEfforts.includes(persisted);

    /** @type {import('../../../types/new-tab.js').ReasoningEffort | null} */
    const fallbackEffort = supportedEfforts[0] ?? null;
    const selectedEffort = isPersistedSupported ? persisted : fallbackEffort;

    return { selectedEffort, supportedEfforts, setSelectedReasoningEffort };
}
