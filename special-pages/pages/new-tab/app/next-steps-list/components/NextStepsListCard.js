import { h, Fragment } from 'preact';
import { useState, useCallback, useRef, useEffect } from 'preact/hooks';
import cn from 'classnames';
import { Button } from '../../../../../shared/components/Button/Button.js';
import styles from './NextStepsListCard.module.css';

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
    return (
        <Fragment>
            <div class={styles.imageContainer}>{imageSrc && <img src={imageSrc} alt="" class={styles.image} />}</div>
            <div class={styles.content}>
                <h3 class={styles.title}>{title}</h3>
                <p class={styles.description}>{description}</p>
                <div class={styles.buttonRow}>
                    <Button variant="accentBrand" size="lg" onClick={onPrimaryClick}>
                        {primaryButtonText}
                    </Button>
                    <Button variant="standard" size="lg" onClick={onSecondaryClick}>
                        {secondaryButtonText}
                    </Button>
                </div>
            </div>
        </Fragment>
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
    const [isEntering, setIsEntering] = useState(false);
    const [dismissingCard, setDismissingCard] = useState(/** @type {CardContent | null} */ (null));
    // Track the previous next card for the "third card" animation
    const [promotingCard, setPromotingCard] = useState(/** @type {CardContent | null} */ (null));
    const prevItemIdRef = useRef(itemId);

    // When itemId changes, trigger enter animation
    useEffect(() => {
        if (prevItemIdRef.current === itemId) {
            return;
        }
        setIsEntering(true);
        // Remove entering class after animation completes (300ms to match CSS)
        const timer = setTimeout(() => {
            setIsEntering(false);
        }, 300);
        prevItemIdRef.current = itemId;
        return () => clearTimeout(timer);
    }, [itemId]);

    // Clear dismissing card after animation completes
    useEffect(() => {
        if (!dismissingCard) return;
        const timer = setTimeout(() => {
            setDismissingCard(null);
            setPromotingCard(null);
        }, 300);
        return () => clearTimeout(timer);
    }, [dismissingCard]);

    const handleSecondaryAction = useCallback(() => {
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
    }, [itemId, title, description, primaryButtonText, secondaryButtonText, imageSrc, nextCard, onSecondaryAction]);

    // During transition, we use the promoting card as the visible "front" card
    // and hide the actual current card until the animation completes
    const isTransitioning = !!dismissingCard;

    return (
        <div class={styles.wrapper}>
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
                {/* Current card - hidden during transition, shown after animation completes */}
                {!isTransitioning && (
                    <div
                        key={itemId}
                        class={cn(styles.card, {
                            [styles.entering]: isEntering,
                        })}
                    >
                        <CardBody
                            title={title}
                            description={description}
                            primaryButtonText={primaryButtonText}
                            secondaryButtonText={secondaryButtonText}
                            imageSrc={imageSrc}
                            onPrimaryClick={onPrimaryAction}
                            onSecondaryClick={handleSecondaryAction}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
