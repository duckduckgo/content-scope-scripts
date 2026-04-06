import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { useSelectedModel } from '../../useSelectedModel';
import { useModelSelector } from './useModelSelector';
import { ModelSelector } from './ModelSelector';

/**
 * @typedef {import('../../../strings.json')} Strings
 */

/**
 * Model selector dropdown UI. All model state is derived via
 * useSelectedModel() hook — no callbacks needed.
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
