import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { useTypedTranslationWith } from '../../../../types';
import { OmnibarContext } from '../../OmnibarProvider';
import { useSelectedReasoningEffort } from '../../useSelectedReasoningEffort';
import { ExtendedReasoningIcon, FastReasoningIcon, ReasoningEffortIcon } from './Icons';
import { ReasoningPicker } from './ReasoningPicker';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 * @typedef {import('./ReasoningPicker').ReasoningEffortIconComponent} ReasoningEffortIconComponent
 */

/**
 * Maps a server-provided reasoning-effort id to its icon. Native controls the id set, so unknown
 * ids fall back to the generic reasoning icon rather than dropping the option.
 *
 * @param {ReasoningEffort} id
 * @returns {ReasoningEffortIconComponent}
 */
function getReasoningIcon(id) {
    switch (id) {
        case 'none':
        case 'minimal':
            return FastReasoningIcon;
        case 'extended':
        case 'high':
            return ExtendedReasoningIcon;
        case 'low':
        case 'medium':
            return ReasoningEffortIcon;
        default:
            return ReasoningEffortIcon;
    }
}

export function ReasoningPickerTool() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { showUpsell, pickerShown, upsellShown } = useContext(OmnibarContext);
    const { reasoningEfforts, selectedEffort, setSelectedReasoningEffort } = useSelectedReasoningEffort();

    const options = reasoningEfforts.map((effort) => ({
        id: effort.id,
        name: effort.name,
        description: effort.description,
        status: effort.status,
        upsell: effort.upsell,
        icon: getReasoningIcon(effort.id),
    }));

    if (options.length < 2) {
        return null;
    }

    // The upsell badge renders for any gated (unavailable) option.
    const hasUpsell = options.some((option) => option.status === 'unavailable');

    const selectedOption = options.find((option) => option.id === selectedEffort);

    return (
        <ReasoningPicker
            options={options}
            selectedEffort={selectedEffort}
            onSelect={setSelectedReasoningEffort}
            onUpsell={(type) => showUpsell(type, 'reasoning')}
            onOpen={() => {
                pickerShown('reasoning');
                if (hasUpsell) upsellShown('reasoning');
            }}
            ariaLabel={t('omnibar_reasoningPickerLabel')}
            buttonLabel={selectedOption?.name ?? t('omnibar_reasoningPickerLabel')}
            tryForFreeLabel={t('omnibar_reasoningTryForFree')}
            upgradeLabel={t('omnibar_upgrade')}
        />
    );
}
