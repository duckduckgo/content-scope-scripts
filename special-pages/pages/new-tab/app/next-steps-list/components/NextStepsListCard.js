import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import cn from 'classnames';
import { Button } from '../../../../../shared/components/Button/Button.js';
import { DismissButton } from '../../components/DismissButton';
import { usePlatformName } from '../../settings.provider.js';
import { useTypedTranslationWith } from '../../types.js';
import styles from './NextStepsListCard.module.css';

/**
 * @import enStrings from '../strings.json';
 */

/**
 * @typedef {object} CardBodyProps
 * @property {string} title
 * @property {string} description
 * @property {string} primaryButtonText
 * @property {string} secondaryButtonText
 * @property {string} [imageSrc]
 * @property {() => void} [onPrimaryClick]
 * @property {() => void} [onSecondaryClick]
 */

/**
 * The inner content of a card (image, text, buttons)
 * @param {CardBodyProps} props
 */
function CardBody({ title, description, primaryButtonText, secondaryButtonText, imageSrc, onPrimaryClick, onSecondaryClick }) {
    const platformName = usePlatformName();
    const primaryButton = (
        <Button variant="accentBrand" size="lg" onClick={onPrimaryClick}>
            {primaryButtonText}
        </Button>
    );
    const secondaryButton = (
        <Button variant="standard" size="lg" onClick={onSecondaryClick}>
            {secondaryButtonText}
        </Button>
    );
    return (
        <Fragment>
            <div class={styles.imageContainer}>{imageSrc && <img src={imageSrc} alt="" class={styles.image} />}</div>
            <div class={styles.content}>
                <h3 class={styles.title}>{title}</h3>
                <p class={styles.description}>{description}</p>
                <div class={styles.buttonRow}>
                    {platformName === 'windows' ? (
                        <Fragment>
                            {primaryButton}
                            {secondaryButton}
                        </Fragment>
                    ) : (
                        <Fragment>
                            {secondaryButton}
                            {primaryButton}
                        </Fragment>
                    )}
                </div>
            </div>
        </Fragment>
    );
}

/**
 * Bubble header label displayed above the card, mirroring the one used by next-steps.
 */
function NextStepsListBubbleHeader() {
    const { t } = useTypedTranslationWith(/** @type {enStrings} */ ({}));
    return (
        <div class={styles.bubble}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="26" viewBox="0 0 12 26" fill="none">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12 0C5.37258 0 0 5.37258 0 12V25.3388C2.56367 22.0873 6.53807 20 11 20H12V0Z"
                    fill="#3969EF"
                />
            </svg>
            <div>
                <h2>{t('nextStepsList_sectionTitle')}</h2>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 10 20" fill="none">
                <path
                    d="M3.8147e-06 0C1.31322 1.566e-08 2.61358 0.258658 3.82684 0.761205C5.04009 1.26375 6.14249 2.00035 7.07107 2.92893C7.99966 3.85752 8.73625 4.95991 9.2388 6.17317C9.74135 7.38642 10 8.68678 10 10C10 11.3132 9.74135 12.6136 9.2388 13.8268C8.73625 15.0401 7.99966 16.1425 7.07107 17.0711C6.14248 17.9997 5.04009 18.7362 3.82684 19.2388C2.61358 19.7413 1.31322 20 0 20L3.8147e-06 10V0Z"
                    fill="#3969EF"
                />
            </svg>
        </div>
    );
}

/**
 * @typedef {object} CardContent
 * @property {string} itemId
 * @property {string} title
 * @property {string} description
 * @property {string} primaryButtonText
 * @property {string} secondaryButtonText
 * @property {string} [imageSrc]
 */

/**
 * @typedef {object} NextStepsListCardProps
 * @property {string} itemId - The unique ID of the current item
 * @property {string} title - The title text
 * @property {string} description - The description text
 * @property {string} primaryButtonText - Text for the primary action button
 * @property {string} secondaryButtonText - Text for the secondary button
 * @property {string} [imageSrc] - Optional image source
 * @property {CardContent | null} [nextCard] - The next card to show behind (stacked)
 * @property {() => void} [onPrimaryAction] - Handler for primary button click
 * @property {() => void} [onSecondaryAction] - Handler for secondary button click
 */

/**
 * A card component for the Next Steps List widget
 * @param {NextStepsListCardProps} props
 */
export function NextStepsListCard({
    itemId,
    title,
    description,
    primaryButtonText,
    secondaryButtonText,
    imageSrc,
    nextCard,
    onPrimaryAction,
    onSecondaryAction,
}) {
    const [dismissingCard, setDismissingCard] = useState(/** @type {CardContent | null} */ (null));
    // Track the previous next card for the "third card" animation
    const [promotingCard, setPromotingCard] = useState(/** @type {CardContent | null} */ (null));

    // Clear dismissing card after animation completes
    useEffect(() => {
        if (!dismissingCard) return;
        const timer = setTimeout(() => {
            setDismissingCard(null);
            setPromotingCard(null);
        }, 300);
        return () => clearTimeout(timer);
    }, [dismissingCard]);

    const handleSecondaryAction = () => {
        // Store current card content for dismiss animation
        setDismissingCard({
            itemId,
            title,
            description,
            primaryButtonText,
            secondaryButtonText,
            imageSrc,
        });
        // Store next card for the "promoting to front" animation
        if (nextCard) {
            setPromotingCard(nextCard);
        }
        // Trigger data update immediately - new card will animate in
        onSecondaryAction?.();
    };

    // During transition, we use the promoting card as the visible "front" card
    // and hide the actual current card until the animation completes
    const isTransitioning = !!dismissingCard;

    return (
        <div class={styles.wrapper}>
            <NextStepsListBubbleHeader />
            <div class={styles.cardContainer}>
                {/* Back card (peek card) - shows next step behind current card */}
                {/* During transition, this is the "third" card being revealed */}
                {nextCard && (
                    <div class={cn(styles.card, styles.backCard)} aria-hidden="true">
                        <CardBody
                            title={nextCard.title}
                            description={nextCard.description}
                            primaryButtonText={nextCard.primaryButtonText}
                            secondaryButtonText={nextCard.secondaryButtonText}
                            imageSrc={nextCard.imageSrc}
                        />
                    </div>
                )}
                {/* Promoting card - the back card animating to front position */}
                {promotingCard && (
                    <div key={`promoting-${promotingCard.itemId}`} class={cn(styles.card, styles.promoting)}>
                        <CardBody
                            title={promotingCard.title}
                            description={promotingCard.description}
                            primaryButtonText={promotingCard.primaryButtonText}
                            secondaryButtonText={promotingCard.secondaryButtonText}
                            imageSrc={promotingCard.imageSrc}
                        />
                    </div>
                )}
                {/* Dismissing card - shows old content animating out */}
                {dismissingCard && (
                    <div key={dismissingCard.itemId} class={cn(styles.card, styles.dismissing)}>
                        <CardBody
                            title={dismissingCard.title}
                            description={dismissingCard.description}
                            primaryButtonText={dismissingCard.primaryButtonText}
                            secondaryButtonText={dismissingCard.secondaryButtonText}
                            imageSrc={dismissingCard.imageSrc}
                        />
                    </div>
                )}
                {/* Current card - kept in DOM during transition to preserve container height */}
                <div
                    key={itemId}
                    class={cn(styles.card, {
                        [styles.offscreen]: isTransitioning,
                    })}
                    aria-hidden={isTransitioning ? 'true' : undefined}
                >
                    <CardBody
                        title={title}
                        description={description}
                        primaryButtonText={primaryButtonText}
                        secondaryButtonText={secondaryButtonText}
                        imageSrc={imageSrc}
                        onPrimaryClick={isTransitioning ? undefined : onPrimaryAction}
                        onSecondaryClick={isTransitioning ? undefined : handleSecondaryAction}
                    />
                    {!isTransitioning && <DismissButton className={styles.dismissBtn} onClick={handleSecondaryAction} />}
                </div>
            </div>
        </div>
    );
}
