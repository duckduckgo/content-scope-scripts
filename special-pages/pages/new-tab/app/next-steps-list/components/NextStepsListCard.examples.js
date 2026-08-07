import { h, Fragment } from 'preact';
import { useContext } from 'preact/hooks';

import { noop } from '../../utils.js';
import { useTypedTranslationWith } from '../../types.js';
import { CustomizerThemesContext } from '../../customizer/CustomizerProvider.js';
import { useNewTabPageRebranding } from '../../settings.provider.js';
import { variants, getIconPath } from '../next-steps-list.data.js';
import { NextStepsListCard } from './NextStepsListCard.js';

/**
 * @import enStrings from '../strings.json'
 * @typedef {keyof typeof variants} NextStepsListVariantId
 */

/**
 * @param {object} props
 * @param {NextStepsListVariantId} props.type
 * @param {NextStepsListVariantId} [props.nextType]
 */
function NextStepsListExample({ type, nextType }) {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    const { main: themeSignal } = useContext(CustomizerThemesContext);
    const theme = themeSignal.value;
    const isRebrandEnabled = useNewTabPageRebranding();

    const variant = variants[type](t);
    /** @type {import('./NextStepsListCard.js').CardContent | null} */
    let nextCard = null;

    if (nextType) {
        const nextVariant = variants[nextType](t);
        nextCard = {
            itemId: nextVariant.id,
            title: nextVariant.title,
            description: nextVariant.summary,
            primaryButtonText: nextVariant.actionText,
            secondaryButtonText: t('nextStepsList_maybeLater'),
            imageSrc: getIconPath(nextVariant.icon, theme, isRebrandEnabled),
        };
    }

    return (
        <NextStepsListCard
            itemId={variant.id}
            title={variant.title}
            description={variant.summary}
            primaryButtonText={variant.actionText}
            secondaryButtonText={t('nextStepsList_maybeLater')}
            imageSrc={getIconPath(variant.icon, theme, isRebrandEnabled)}
            nextCard={nextCard}
            onPrimaryAction={noop(`next-steps-list.action.${type}`)}
            onSecondaryAction={noop(`next-steps-list.dismiss.${type}`)}
        />
    );
}

/** @type {NextStepsListVariantId[]} */
const allVariantIds = /** @type {NextStepsListVariantId[]} */ (Object.keys(variants));

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const nextStepsListExamples = {
    'next-steps-list.all': {
        factory: () => (
            <Fragment>
                {allVariantIds.map((type) => (
                    <NextStepsListExample key={type} type={type} />
                ))}
            </Fragment>
        ),
    },
    'next-steps-list.stacked': {
        factory: () => <NextStepsListExample type="emailProtection" nextType="duckplayer" />,
    },
    'next-steps-list.stacked.three': {
        // Peek only shows the immediate next card; useful for comparing front + back art.
        factory: () => <NextStepsListExample type="bringStuff" nextType="sync" />,
    },
};

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const otherNextStepsListExamples = Object.fromEntries(
    allVariantIds.map((type) => [
        `next-steps-list.${type}`,
        {
            factory: () => <NextStepsListExample type={type} />,
        },
    ]),
);
