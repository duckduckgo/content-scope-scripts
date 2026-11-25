import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import { useModelPick } from './TabModelPick.js';
import { resolveImageGenerationModel, resolveModel } from './modelPick.js';

/**
 * @typedef {import('../../../types/new-tab.js').AIModelSections} AIModelSections
 * @typedef {AIModelSections[number]['items'][number]} AIModelItem
 */

export function useSelectedModel() {
    const { state, activeTool } = useContext(OmnibarContext);
    const { modelId, pickModel } = useModelPick();

    const aiModelSections = state.config?.enableAiChatTools === true ? (state.config?.aiModelSections ?? []) : [];
    const allModels = aiModelSections.flatMap((s) => s.items);

    const pickedModel = resolveModel(allModels, modelId);
    const selectedModel = createImageSwitchesTabModel(state.config, activeTool)
        ? resolveImageGenerationModel(pickedModel, allModels, state.config?.imageGenerationModelId)
        : pickedModel;

    return { selectedModel, aiModelSections, allModels, setSelectedModelId: pickModel };
}

/**
 * With per-tab picks native can't switch each tab's model for Create Image, so the page does it while the tool is on.
 * @param {import('../../../types/new-tab.js').OmnibarConfig | null} config
 * @param {import('./chat-tools/tools-menu/ToolsMenu').ToolId | null} activeTool
 */
function createImageSwitchesTabModel(config, activeTool) {
    return (
        config?.enablePerTabModelPick === true &&
        config.enableUpdatedCreateImage === true &&
        config.enableImageGeneration === true &&
        activeTool === 'image-generation'
    );
}
