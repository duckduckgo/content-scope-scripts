import { useSelectedModel } from './useSelectedModel';
import { useModelPick } from './TabModelPick.js';
import { resolveReasoningEffort } from './modelPick.js';

/**
 * @typedef {import('../../../types/new-tab.js').ReasoningEffortOption} ReasoningEffortOption
 */

export function useSelectedReasoningEffort() {
    const { reasoningEffort, pickReasoningEffort } = useModelPick();
    const { selectedModel } = useSelectedModel();

    /** @type {ReasoningEffortOption[]} */
    const reasoningEfforts = selectedModel?.reasoningEfforts ?? [];
    const selectedEffort = resolveReasoningEffort(selectedModel, reasoningEffort);

    return { selectedEffort, reasoningEfforts, setSelectedReasoningEffort: pickReasoningEffort };
}
