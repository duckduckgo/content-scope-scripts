import { h } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { OmnibarContext } from '../../OmnibarProvider';
import { useModelSelector } from './useModelSelector';
import { ModelSelector } from './ModelSelector';
import { useChatTools } from '../ChatToolsProvider';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('./useModelSelector').AIModelItem} AIModelItem
 */

const TOOL_ID = 'modelSelector';

/**
 * Self-contained model selector tool. Registers its submit data
 * (modelId) with the ChatToolsContext.
 *
 * @param {object} props
 * @param {(model: AIModelItem | null) => void} [props.onSelectedModelChange]
 */
export function ModelSelectorTool({ onSelectedModelChange }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { setSelectedModelId: persistModelId, state } = useContext(OmnibarContext);

    const enableAiChatTools = state.config?.enableAiChatTools === true;
    const aiModelSections = enableAiChatTools ? (state.config?.aiModelSections ?? []) : [];

    const selector = useModelSelector({
        aiModelSections,
        persistedModelId: state.config?.selectedModelId,
        onModelChange: persistModelId,
    });

    const { selectedModelId, selectedModel } = selector;

    const { registerTool, unregisterTool } = useChatTools();

    const selectedModelIdRef = useRef(selectedModelId);
    selectedModelIdRef.current = selectedModelId;
    const selectedModelRef = useRef(selectedModel);
    selectedModelRef.current = selectedModel;

    useEffect(() => {
        registerTool(TOOL_ID, {
            getSubmitData: () => {
                const id = selectedModelIdRef.current;
                if (selectedModelRef.current?.id === id && id) {
                    return { modelId: id };
                }
                return {};
            },
        });
        return () => unregisterTool(TOOL_ID);
    }, []);

    useEffect(() => {
        onSelectedModelChange?.(selectedModel ?? null);
    }, [selectedModel]);

    if (aiModelSections.length === 0) return null;

    return <ModelSelector selector={selector} aiModelSections={aiModelSections} ariaLabel={t('omnibar_modelSelectorLabel')} />;
}
