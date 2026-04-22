import { useContext } from 'preact/hooks';
import { OmnibarContext } from './OmnibarProvider';
import { useSelectedModel } from './useSelectedModel';

export function useSelectedReasoningEffort() {
    const { state, setSelectedReasoningEffort } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();

    const supportedEfforts = selectedModel?.supportedReasoningEffort ?? [];
    console.log('supportedEfforts', supportedEfforts);
    console.log('selectedModel', selectedModel);

    // OmnibarService.setSelectedModelId reconciles selectedReasoningEffort on model change, so the
    // persisted value should stay valid. This guard is a safety net for the rare case where native
    // delivers a stale value on read (e.g. capabilities changed between sessions).
    const persisted = state.config?.selectedReasoningEffort;
    const selectedEffort = persisted && supportedEfforts.includes(persisted) ? persisted : (supportedEfforts[0] ?? null);

    return { selectedEffort, supportedEfforts, setSelectedReasoningEffort };
}
