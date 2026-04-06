import { useContext, useMemo } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * @typedef {import('../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {AIModelSections[number]['items'][number]} AIModelItem
 */

/**
 * Everything model-related in one place: the resolved selected model,
 * gated model sections, and the setter to persist a selection.
 */
export function useSelectedModel() {
    const { state, setSelectedModelId } = useContext(OmnibarContext);

    const aiModelSections = useMemo(
        () => (state.config?.enableAiChatTools === true ? (state.config?.aiModelSections ?? []) : []),
        [state.config?.enableAiChatTools, state.config?.aiModelSections],
    );

    const allModels = useMemo(() => aiModelSections.flatMap((s) => s.items), [aiModelSections]);

    const selectedModel = useMemo(() => {
        const persistedId = state.config?.selectedModelId;
        const match = persistedId ? allModels.find((m) => m.id === persistedId && m.isEnabled) : null;
        return match ?? allModels.find((m) => m.isEnabled) ?? null;
    }, [allModels, state.config?.selectedModelId]);

    return { selectedModel, aiModelSections, allModels, setSelectedModelId };
}
