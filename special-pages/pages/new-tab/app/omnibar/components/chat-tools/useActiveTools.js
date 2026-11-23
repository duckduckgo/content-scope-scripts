import { useContext } from 'preact/hooks';
import { OmnibarContext } from '../OmnibarProvider';
import { useSelectedModel } from '../useSelectedModel';

/** @typedef {import('./tools-menu/ToolsMenu').ToolId} ToolId */

/**
 * Exposes the shared tool selection, filtered by feature configuration and selected model support.
 * Selecting or clearing a tool updates the selection for every NTP tab in the page.
 */
export function useActiveTools() {
    const { state, activeTool, setActiveTool } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();

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
