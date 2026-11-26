import { h, createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider.js';
import { ModelPicks } from './PersistentOmnibarValuesProvider.js';
import { resolveModel, resolveReasoningEffort } from './modelPick.js';

/**
 * @typedef {import('./modelPick.js').ModelPick} ModelPick
 * @typedef {import('./modelPick.js').AIModelItem} AIModelItem
 * @typedef {import('../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 * @typedef {object} ModelPickActions
 * @property {boolean} keptPerTab - the page, not native, keeps the pick
 * @property {string | undefined} modelId - the tab's pick, else the default
 * @property {ReasoningEffort | undefined} reasoningEffort - the tab's pick, else the default
 * @property {(modelId: string) => void} pickModel - the user picked a model
 * @property {(effort: ReasoningEffort) => void} pickReasoningEffort - the user picked an effort
 * @property {(modelId: string) => void} switchToModel - native already switched the model, so the tab follows
 * @typedef {import('preact').ContextType<typeof OmnibarContext>} OmnibarActions
 */

const TabModelPickContext = createContext({
    /** @type {ModelPick | null} */
    pick: null,
    /** @type {((pick: ModelPick | null) => void) | null} */
    setPick: null,
});

/**
 * Holds the model pick of the tab the Omnibar is showing.
 * @param {object} props
 * @param {string|null|undefined} props.tabId
 * @param {import('preact').ComponentChildren} props.children
 */
export function TabModelPickProvider({ tabId, children }) {
    const [pick, setPick] = ModelPicks.useStateWithLocalPersistence(tabId);
    return <TabModelPickContext.Provider value={{ pick, setPick }}>{children}</TabModelPickContext.Provider>;
}

/**
 * The current tab's model and effort, and how to change them. With `enablePerTabModelPick` each tab keeps its own pick
 * over the native default; otherwise native keeps one pick for every tab.
 * @returns {ModelPickActions}
 */
export function useModelPick() {
    const omnibar = useContext(OmnibarContext);
    const { pick, setPick } = useContext(TabModelPickContext);
    const config = omnibar.state.config;
    if (config?.enablePerTabModelPick === true && setPick) {
        const models = (config.aiModelSections ?? []).flatMap((section) => section.items);
        return tabModelPick({ pick, setPick, models, config, omnibar });
    }
    return nativeModelPick({ config, omnibar });
}

/**
 * @param {object} params
 * @param {import('../../../types/new-tab.js').OmnibarConfig | null} params.config
 * @param {OmnibarActions} params.omnibar
 * @returns {ModelPickActions}
 */
function nativeModelPick({ config, omnibar }) {
    return {
        keptPerTab: false,
        modelId: config?.selectedModelId,
        reasoningEffort: config?.selectedReasoningEffort,
        pickModel: omnibar.setSelectedModelId,
        pickReasoningEffort: omnibar.setSelectedReasoningEffort,
        switchToModel: () => {},
    };
}

/**
 * @param {object} params
 * @param {ModelPick | null} params.pick
 * @param {(pick: ModelPick | null) => void} params.setPick
 * @param {AIModelItem[]} params.models
 * @param {import('../../../types/new-tab.js').OmnibarConfig} params.config
 * @param {OmnibarActions} params.omnibar
 * @returns {ModelPickActions}
 */
function tabModelPick({ pick, setPick, models, config, omnibar }) {
    const modelId = pick?.modelId ?? config.selectedModelId;
    const reasoningEffort = pick?.reasoningEffort ?? config.selectedReasoningEffort;

    /** @param {string} nextModelId */
    const switchToModel = (nextModelId) => {
        const nextModel = models.find((model) => model.id === nextModelId);
        setPick({ modelId: nextModelId, reasoningEffort: resolveReasoningEffort(nextModel, reasoningEffort) ?? undefined });
    };

    return {
        keptPerTab: true,
        modelId,
        reasoningEffort,
        pickModel: (nextModelId) => {
            const previousModelId = resolveModel(models, modelId)?.id;
            switchToModel(nextModelId);
            omnibar.selectModel(previousModelId ? { modelId: nextModelId, previousModelId } : { modelId: nextModelId });
        },
        pickReasoningEffort: (effort) => {
            setPick({ ...pick, reasoningEffort: effort });
            omnibar.selectReasoningEffort(effort);
        },
        switchToModel,
    };
}
