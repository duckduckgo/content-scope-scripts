import { useContext, useState } from 'preact/hooks';
import { OmnibarContext } from '../OmnibarProvider';
import { useModelConfig } from '../useModelConfig';

/** @typedef {import('./tools-menu/ToolsMenu').ToolId} ToolId */

export function useActiveTools() {
    const { state } = useContext(OmnibarContext);
    const { selectedModel } = useModelConfig();
    const [activeTool, setActiveTool] = useState(/** @type {ToolId|null} */ (null));

    const modelSupportedTools = selectedModel?.supportedTools ?? [];

    /** @type {ToolId[]} */
    const availableTools = [
        ...(state.config?.enableImageGeneration === true ? [/** @type {const} */ ('image-generation')] : []),
        ...(state.config?.enableWebSearch === true && modelSupportedTools.includes('WebSearch')
            ? [/** @type {const} */ ('web-search')]
            : []),
    ];

    const validActiveTool = activeTool !== null && availableTools.includes(activeTool) ? activeTool : null;
    const imageGenerationActive = validActiveTool === 'image-generation';
    const webSearchActive = validActiveTool === 'web-search';

    return {
        activeTool: validActiveTool,
        availableTools,
        imageGenerationActive,
        webSearchActive,
        setActiveTool,
    };
}
