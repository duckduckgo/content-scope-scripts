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

/**
 * @param {object} props
 * @param {boolean} [props.readOnly]
 */
export function ModelSelectorTool({ readOnly = false }) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { state, showUpsell } = useContext(OmnibarContext);
    const { selectedModel, aiModelSections, allModels, setSelectedModelId } = useSelectedModel();
    const isEligibleForFreeTrial = state.config?.isEligibleForFreeTrial !== false;
    const blocksPrompt = state.config?.usageLimits?.blocksPrompt === true;

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
            onUpsell={(type) => showUpsell(type, 'model')}
            disabled={blocksPrompt}
            readOnly={readOnly}
            ariaLabel={t('omnibar_modelSelectorLabel')}
            isEligibleForFreeTrial={isEligibleForFreeTrial}
        />
    );
}
