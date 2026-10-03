import { useContext, useState } from 'preact/hooks';
import { OmnibarContext } from '../OmnibarProvider';
import { useSelectedModel } from '../useSelectedModel';

/** @typedef {import('./tools-menu/ToolsMenu').ToolId} ToolId */

export function useActiveTools() {
    const { state, imageGenerationActive: imageGenerationActiveForPage } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();
    // Seeded on mount, which happens on every tab switch, so a new tab picks up Create Image from the previous one.
    const [activeTool, setActiveTool] = useState(/** @type {ToolId|null} */ (imageGenerationActiveForPage ? 'image-generation' : null));

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
