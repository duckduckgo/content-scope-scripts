import { h } from 'preact';
import { NextStepsListContext, NextStepsListProvider } from './NextStepsListProvider.js';
import { useContext } from 'preact/hooks';
import { NextStepsListCard } from './components/NextStepsListCard.js';
import { variants, getMaybeLaterText, getIconPath } from './nextstepslist.data.js';
import { useTypedTranslationWith } from '../types.js';
import { CustomizerThemesContext } from '../customizer/CustomizerProvider.js';

/**
 * @import enStrings from './strings.json';
 */

/**
 * Use this when rendered within a widget list.
 *
 * It reaches out to access this widget's global visibility, and chooses
 * whether to incur the side effects (data fetching).
 */
export function NextStepsListCustomized() {
    return (
        <NextStepsListProvider>
            <NextStepsListConsumer />
        </NextStepsListProvider>
    );
}

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <NextStepsListProvider>
 *     <NextStepsListConsumer />
 * </NextStepsListProvider>
 * ```
 */
export function NextStepsListConsumer() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const { state, action, dismiss } = useContext(NextStepsListContext);
    const { main: themeSignal } = useContext(CustomizerThemesContext);
    const theme = themeSignal.value;

    if (state.status === 'ready' && state.data.content && state.data.content.length > 0) {
        // Get the first item's ID and find its variant
        const firstItem = state.data.content[0];
        const variantFn = variants[firstItem.id];

        // If we don't have a variant for this ID, don't render
        if (!variantFn) {
            console.warn(`No variant found for Next Steps List item: ${firstItem.id}`);
            return null;
        }

        const variantData = variantFn(t);
        const totalSteps = state.data.content.length;
        const iconPath = getIconPath(variantData.icon, theme);

        return (
            <NextStepsListCard
                title={variantData.title}
                description={variantData.summary}
                primaryButtonText={variantData.actionText}
                secondaryButtonText={getMaybeLaterText(t)}
                imageSrc={iconPath}
                currentStep={1}
                totalSteps={totalSteps}
                onPrimaryAction={() => action(firstItem.id)}
                onSecondaryAction={() => dismiss(firstItem.id)}
            />
        );
    }
    return null;
}
