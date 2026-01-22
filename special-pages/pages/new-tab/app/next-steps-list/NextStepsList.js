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
        // Filter to only known IDs (skip unknown ones)
        const items = state.data.content.filter((x) => x.id in variants);

        // If no known items, don't render
        if (items.length === 0) return null;

        const displayedItemId = items[0].id;
        const { title, summary, actionText, icon } = variants[displayedItemId](t);
        const iconPath = getIconPath(icon, theme);

        return (
            <NextStepsListCard
                itemId={displayedItemId}
                title={title}
                description={summary}
                primaryButtonText={actionText}
                secondaryButtonText={getMaybeLaterText(t)}
                imageSrc={iconPath}
                totalSteps={items.length}
                onPrimaryAction={() => action(displayedItemId)}
                onSecondaryAction={() => dismiss(displayedItemId)}
            />
        );
    }
    return null;
}
