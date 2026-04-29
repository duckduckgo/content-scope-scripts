import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { useSelectedModel } from '../../useSelectedModel';
import { useModelSelector } from './useModelSelector';
import { ModelSelector } from './ModelSelector';

/**
 * @typedef {import('../../../strings.json')} Strings
 */

export function ModelSelectorTool() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { selectedModel, aiModelSections, allModels, setSelectedModelId } = useSelectedModel();

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
