import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import { useModelConfig } from './useModelConfig';

/**
 * Provides model data gated behind the `enableAiChatTools` feature flag.
 * Returns empty data when the flag is off, hiding the model selector UI.
 * For ungated model access, use {@link useModelConfig} instead.
 */
export function useAiToolsModelConfig() {
    const { state } = useContext(OmnibarContext);
    const modelConfig = useModelConfig();

    if (state.config?.enableAiChatTools !== true) {
        return {
            selectedModel: null,
            aiModelSections: /** @type {import('./useModelConfig').AIModelSections} */ ([]),
            allModels: /** @type {import('./useModelConfig').AIModelItem[]} */ ([]),
            setSelectedModelId: modelConfig.setSelectedModelId,
        };
    }

    return modelConfig;
}
