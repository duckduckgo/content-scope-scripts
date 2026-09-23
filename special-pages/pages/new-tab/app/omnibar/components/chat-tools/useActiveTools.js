import { useContext, useEffect, useState } from 'preact/hooks';
import { OmnibarContext } from '../OmnibarProvider';
import { useSelectedModel } from '../useSelectedModel';

/** @typedef {import('./tools-menu/ToolsMenu').ToolId} ToolId */

export function useActiveTools() {
    const { state } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();
    const [activeTool, setActiveTool] = useState(/** @type {ToolId|null} */ (null));
    const updatedCreateImageEnabled = state.config?.enableUpdatedCreateImage === true;
    const nativeImageGenerationActive = state.config?.imageGenerationActive;

    useEffect(() => {
        if (!updatedCreateImageEnabled || typeof nativeImageGenerationActive !== 'boolean') return;

        setActiveTool((current) => {
            if (nativeImageGenerationActive) return 'image-generation';
            return current === 'image-generation' ? null : current;
        });
    }, [nativeImageGenerationActive, updatedCreateImageEnabled]);

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
