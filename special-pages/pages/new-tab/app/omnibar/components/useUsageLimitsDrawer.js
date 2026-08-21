import { useCallback, useState } from 'preact/hooks';
import { useTypedTranslationWith } from '../../types';

/**
 * @typedef {typeof import('../strings.json')} Strings
 */

/**
 * Stage 1: hardcoded educational Opus banner with session-local dismiss.
 * Later replaced by native-driven config / subscribe over the message bridge.
 *
 * @returns {{
 *   visible: boolean,
 *   message: string,
 *   secondaryText: string,
 *   dismissible: boolean,
 *   onDismiss: () => void,
 * }}
 */
export function useUsageLimitsDrawer() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const [dismissed, setDismissed] = useState(false);

    const onDismiss = useCallback(() => {
        setDismissed(true);
    }, []);

    return {
        visible: !dismissed,
        message: t('omnibar_usageLimitsOpusMessage'),
        secondaryText: '',
        dismissible: true,
        onDismiss,
    };
}
