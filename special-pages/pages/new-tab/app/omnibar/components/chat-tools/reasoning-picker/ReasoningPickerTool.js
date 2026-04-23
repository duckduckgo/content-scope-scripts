import { h } from 'preact';
import { useTypedTranslationWith } from '../../../../types';
import { useSelectedReasoningEffort } from '../../useSelectedReasoningEffort';
import { ReasoningPicker } from './ReasoningPicker';

/**
 * @typedef {import('../../../strings.json')} Strings
 * @typedef {import('../../../../../types/new-tab.js').ReasoningEffort} ReasoningEffort
 * @typedef {import('./ReasoningPicker').ReasoningEffortOption} ReasoningEffortOption
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
        case 'none':
            return { id: key, label: t('omnibar_reasoningEffortNoneLabel'), description: t('omnibar_reasoningEffortNoneDescription') };
        case 'low':
            return { id: key, label: t('omnibar_reasoningEffortLowLabel'), description: t('omnibar_reasoningEffortLowDescription') };
        case 'medium':
            return {
                id: key,
                label: t('omnibar_reasoningEffortMediumLabel'),
                description: t('omnibar_reasoningEffortMediumDescription'),
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
