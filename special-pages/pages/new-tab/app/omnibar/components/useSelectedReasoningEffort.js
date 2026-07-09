import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import { useSelectedModel } from './useSelectedModel';

/**
 * @typedef {import('../../../types/new-tab.js').ReasoningEffortOption} ReasoningEffortOption
 */

export function useSelectedReasoningEffort() {
    const { state, setSelectedReasoningEffort } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();

    /** @type {ReasoningEffortOption[]} */
    const reasoningEfforts = selectedModel?.reasoningEfforts ?? [];
    const availableEffortIds = reasoningEfforts.filter((effort) => effort.status === 'available').map((effort) => effort.id);

    const persisted = state.config?.selectedReasoningEffort;
    const isPersistedAvailable = persisted != null && availableEffortIds.includes(persisted);

    /** @type {import('../../../types/new-tab.js').ReasoningEffort | null} */
    const fallbackEffort = availableEffortIds[0] ?? null;
    const selectedEffort = isPersistedAvailable ? persisted : fallbackEffort;

    return { selectedEffort, reasoningEfforts, setSelectedReasoningEffort };
}
