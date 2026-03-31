import { h } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { OmnibarContext } from '../../OmnibarProvider';
import { useModelSelector } from './useModelSelector';
import { ModelSelector } from './ModelSelector';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('./useModelSelector').AIModelItem} AIModelItem
 */

/**
 * Model selector UI. The parent reads selectedModelId directly from
 * config state when assembling the submit payload.
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

    const { selectedModel } = selector;

    useEffect(() => {
        onSelectedModelChange?.(selectedModel ?? null);
    }, [selectedModel]);

    if (aiModelSections.length === 0) return null;

    return <ModelSelector selector={selector} aiModelSections={aiModelSections} ariaLabel={t('omnibar_modelSelectorLabel')} />;
}
