import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { useSelectedReasoningEffort } from '../../useSelectedReasoningEffort';
import { ReasoningPicker } from './ReasoningPicker';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 * @typedef {import('./ReasoningDropdown').ReasoningEffortOption} ReasoningEffortOption
 */

/**
 * Builds the localized label + description pair for a given effort key.
 *
 * Returns null for unknown keys: the type narrows to the schema's current values, but at runtime
 * native may introduce a new key before the web app has strings for it. Dropping it is safer than
 * rendering with the raw server string.
 *
 * @param {ReasoningEffort} key
 * @param {ReturnType<typeof useTypedTranslationWith<Strings>>['t']} t
 * @returns {ReasoningEffortOption|null}
 */
function getEffortOption(key, t) {
    switch (key) {
        case 'fast':
            return { id: key, label: t('omnibar_reasoningEffortFastLabel'), description: t('omnibar_reasoningEffortFastDescription') };
        case 'reasoning':
            return {
                id: key,
                label: t('omnibar_reasoningEffortReasoningLabel'),
                description: t('omnibar_reasoningEffortReasoningDescription'),
            };
        case 'auto':
            return { id: key, label: t('omnibar_reasoningEffortAutoLabel'), description: t('omnibar_reasoningEffortAutoDescription') };
        default:
            return null;
    }
}

export function ReasoningPickerTool() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { supportedEfforts, selectedEffort, setSelectedReasoningEffort } = useSelectedReasoningEffort();

    if (supportedEfforts.length === 0) return null;

    const options = /** @type {ReasoningEffortOption[]} */ (supportedEfforts.map((key) => getEffortOption(key, t)).filter(Boolean));

    if (options.length === 0) return null;

    const selectedOption = options.find((option) => option.id === selectedEffort);

    return (
        <ReasoningPicker
            options={options}
            selectedEffort={selectedEffort}
            onSelect={setSelectedReasoningEffort}
            ariaLabel={t('omnibar_reasoningPickerLabel')}
            buttonLabel={selectedOption?.label ?? t('omnibar_reasoningPickerLabel')}
        />
    );
}
