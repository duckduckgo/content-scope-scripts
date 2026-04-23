import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import { useSelectedModel } from './useSelectedModel';

/**
 * Runtime allowlist of reasoning-effort keys the web app knows how to render and submit.
 * Native may advertise new keys before web has strings/icons for them; filter them out so
 * unknown keys never surface in the UI or leak into `omnibar_submitChat` payloads.
 *
 * @type {ReadonlySet<import('../../../types/new-tab.js').ReasoningEffort>}
 */
const KNOWN_REASONING_EFFORTS = new Set(['none', 'low', 'medium']);

export function useSelectedReasoningEffort() {
    const { state, setSelectedReasoningEffort } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();

    const supportedEfforts = (selectedModel?.supportedReasoningEffort ?? []).filter((effort) => KNOWN_REASONING_EFFORTS.has(effort));
    const persisted = state.config?.selectedReasoningEffort;
    const isPersistedSupported = persisted && supportedEfforts.includes(persisted);

    /** @type {import('../../../types/new-tab.js').ReasoningEffort | null} */
    const fallbackEffort = supportedEfforts[0] ?? null;
    const selectedEffort = isPersistedSupported ? persisted : fallbackEffort;

    return { selectedEffort, supportedEfforts, setSelectedReasoningEffort };
}
