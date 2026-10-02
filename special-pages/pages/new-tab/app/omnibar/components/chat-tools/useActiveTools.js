import { createContext, h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { OmnibarContext } from '../OmnibarProvider';
import { useSelectedModel } from '../useSelectedModel';

/** @typedef {import('./tools-menu/ToolsMenu').ToolId} ToolId */
/**
 * @typedef {{
 *   activeTool: ToolId | null,
 *   availableTools: ToolId[],
 *   imageGenerationActive: boolean,
 *   webSearchActive: boolean,
 *   setActiveTool: (tool: ToolId | null) => void,
 * }} ActiveTools
 */

const ActiveToolsContext = createContext(
    /** @type {ActiveTools} */ ({
        activeTool: null,
        availableTools: [],
        imageGenerationActive: false,
        webSearchActive: false,
        setActiveTool: () => {},
    }),
);

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
export function ActiveToolsProvider({ children }) {
    const { state } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();
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

    const value = {
        activeTool: validActiveTool,
        availableTools,
        imageGenerationActive,
        webSearchActive,
        setActiveTool,
    };

    return <ActiveToolsContext.Provider value={value}>{children}</ActiveToolsContext.Provider>;
}

export function useActiveTools() {
    return useContext(ActiveToolsContext);
}
