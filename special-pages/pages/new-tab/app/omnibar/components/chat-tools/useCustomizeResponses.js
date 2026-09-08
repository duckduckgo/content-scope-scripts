import { useContext } from 'preact/hooks';
import { OmnibarContext } from '../OmnibarProvider';

/**
 * Sources the "Customize responses" config and actions from OmnibarContext, the
 * same way {@link useActiveTools} sources tool config — so consumers don't take
 * them as props.
 */
export function useCustomizeResponses() {
    const { state, openCustomizeResponses, setCustomizeResponsesActive } = useContext(OmnibarContext);
    const config = state.config;
    return {
        showCustomizeResponses: config?.enableCustomizeResponses === true,
        customizeResponsesSubLabel: config?.customizeSubLabel,
        hasCustomization: config?.hasCustomization === true,
        customizeResponsesActive: config?.customizationActive === true,
        onOpenCustomizeResponses: openCustomizeResponses,
        onSetCustomizeResponsesActive: setCustomizeResponsesActive,
    };
}
