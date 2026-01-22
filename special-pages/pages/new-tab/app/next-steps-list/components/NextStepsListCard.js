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
 * @property {number} totalSteps - Total number of steps
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
    totalSteps,
    onPrimaryAction,
    onSecondaryAction,
}) {
    const [isEntering, setIsEntering] = useState(false);
    const [dismissingCard, setDismissingCard] = useState(/** @type {CardContent | null} */ (null));
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
        // Trigger data update immediately - new card will fade in
        onSecondaryAction?.();
    }, [itemId, title, description, primaryButtonText, secondaryButtonText, imageSrc, onSecondaryAction]);

    return (
        <div class={styles.wrapper}>
            <div class={styles.cardContainer}>
                {/* Dismissing card - shows old content animating out */}
                {dismissingCard && (
                    <div class={cn(styles.card, styles.dismissing)}>
                        <CardBody
                            title={dismissingCard.title}
                            description={dismissingCard.description}
                            primaryButtonText={dismissingCard.primaryButtonText}
                            secondaryButtonText={dismissingCard.secondaryButtonText}
                            imageSrc={dismissingCard.imageSrc}
                        />
                    </div>
                )}
                {/* Current card - shows new content fading in */}
                <div
                    class={cn(styles.card, {
                        [styles.entering]: isEntering,
                        [styles.hidden]: dismissingCard && !isEntering,
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
            </div>
            <StepIndicator totalSteps={totalSteps} />
        </div>
    );
}

/**
 * Displays the total number of steps as a row of pill indicators
 * @param {object} props
 * @param {number} props.totalSteps - Total number of steps
 */
function StepIndicator({ totalSteps }) {
    const pills = [];
    for (let i = 1; i <= totalSteps; i++) {
        pills.push(<div key={i} class={styles.pill} aria-hidden="true" />);
    }

    return (
        <div class={styles.stepIndicator} aria-label={`${totalSteps} steps`}>
            <div class={styles.stepPills}>{pills}</div>
        </div>
    );
}
