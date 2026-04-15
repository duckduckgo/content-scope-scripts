import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { useAiToolsModelConfig } from '../../useAiToolsModelConfig';
import { useModelSelector } from './useModelSelector';
import { ModelSelector } from './ModelSelector';

/**
 * @typedef {import('../../../strings.json')} Strings
 */

export function ModelSelectorTool() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { selectedModel, aiModelSections, allModels, setSelectedModelId } = useAiToolsModelConfig();

    const selector = useModelSelector({
        allModels,
        onModelChange: setSelectedModelId,
    });

    if (aiModelSections.length === 0) return null;

    return (
        <ModelSelector
            selector={selector}
            selectedModel={selectedModel}
            aiModelSections={aiModelSections}
            ariaLabel={t('omnibar_modelSelectorLabel')}
        />
    );
}
