import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { useSelectedReasoningEffort } from '../../useSelectedReasoningEffort';
import { ExtendedReasoningIcon, FastReasoningIcon, ReasoningEffortIcon } from './Icons';
import { ReasoningPicker } from './ReasoningPicker';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 * @typedef {import('./ReasoningPicker').ReasoningEffortOption} ReasoningEffortOption
 */

/**
 * Builds the full display option (icon, label, description) for a given effort key.
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
        case 'none':
        case 'minimal':
            return {
                id: key,
                reasoningMode: 'fast',
                icon: FastReasoningIcon,
                label: t('omnibar_reasoningEffortFastLabel'),
                description: t('omnibar_reasoningEffortFastDescription'),
            };
        case 'low':
            return {
                id: key,
                reasoningMode: 'reasoning',
                icon: ReasoningEffortIcon,
                label: t('omnibar_reasoningEffortReasoningLabel'),
                description: t('omnibar_reasoningEffortReasoningDescription'),
            };
        case 'medium':
        case 'high':
            return {
                id: key,
                reasoningMode: 'extendedReasoning',
                icon: ExtendedReasoningIcon,
                label: t('omnibar_reasoningEffortExtendedReasoningLabel'),
                description: t('omnibar_reasoningEffortExtendedReasoningDescription'),
            };
        default: {
            /**
             * Exhaustiveness check — `never` means all ReasoningEffort cases are handled;
             * adding a new one without a case will cause a type error here.
             * @type {never}
             */
            const _exhaustiveCheck = key;
            console.error(`Unknown reasoning effort: ${_exhaustiveCheck}`);
            return null;
        }
    }
}

export function ReasoningPickerTool() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { supportedEfforts, selectedEffort, setSelectedReasoningEffort } = useSelectedReasoningEffort();

    const getOptions = () => {
        const mapped = /** @type {ReasoningEffortOption[]} */ (supportedEfforts.map((key) => getEffortOption(key, t)).filter(Boolean));
        const usedModes = new Set();

        return mapped.filter((option) => {
            if (usedModes.has(option.reasoningMode)) {
                return false;
            }
            usedModes.add(option.reasoningMode);
            return true;
        });
    };

    const options = getOptions();
    const hasMultipleOptions = options.length >= 2;

    if (!hasMultipleOptions) {
        return null;
    }

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
