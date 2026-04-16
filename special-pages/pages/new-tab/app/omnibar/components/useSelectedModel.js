import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';

/**
 * @typedef {import('../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {AIModelSections[number]['items'][number]} AIModelItem
 */

export function useSelectedModel() {
    const { state, setSelectedModelId } = useContext(OmnibarContext);

    const aiModelSections = state.config?.enableAiChatTools === true ? (state.config?.aiModelSections ?? []) : [];
    const allModels = aiModelSections.flatMap((s) => s.items);

    const persistedId = state.config?.selectedModelId;
    const match = persistedId ? allModels.find((m) => m.id === persistedId && m.isEnabled) : null;
    const selectedModel = match ?? allModels.find((m) => m.isEnabled) ?? null;

    return { selectedModel, aiModelSections, allModels, setSelectedModelId };
}
