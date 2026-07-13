import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { OmnibarContext } from '../../OmnibarProvider';
import { useSelectedModel } from '../../useSelectedModel';
import { useModelSelector } from './useModelSelector';
import { ModelSelector } from './ModelSelector';

/**
 * @typedef {import('../../../strings.json')} Strings
 */

export function ModelSelectorTool() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { showUpsell, pickerShown, upsellShown } = useContext(OmnibarContext);
    const { selectedModel, aiModelSections, allModels, setSelectedModelId } = useSelectedModel();

    // The upsell CTA renders only for a fully-gated section (mirrors ModelDropdown's `isUpsellSection`).
    const hasUpsell = aiModelSections.some((section) => section.items.length > 0 && section.items.every((model) => !model.isEnabled));

    const selector = useModelSelector({
        allModels,
        onModelChange: setSelectedModelId,
        onOpen: () => {
            pickerShown('model');
            if (hasUpsell) upsellShown('model');
        },
    });

    if (aiModelSections.length === 0) return null;

    return (
        <ModelSelector
            selector={selector}
            selectedModel={selectedModel}
            aiModelSections={aiModelSections}
            onUpsell={(type) => showUpsell(type, 'model')}
            ariaLabel={t('omnibar_modelSelectorLabel')}
        />
    );
}
