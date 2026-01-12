import { h } from 'preact';
import cn from 'classnames';
import { Button } from '../../../../../shared/components/Button/Button.js';
import styles from './NextStepsListCard.module.css';

/**
 * @typedef {object} NextStepsListCardProps
 * @property {string} title - The title text
 * @property {string} description - The description text
 * @property {string} primaryButtonText - Text for the primary action button
 * @property {string} secondaryButtonText - Text for the secondary button
 * @property {string} [imageSrc] - Optional image source
 * @property {number} currentStep - Current step number (1-based)
 * @property {number} totalSteps - Total number of steps
 * @property {() => void} [onPrimaryAction] - Handler for primary button click
 * @property {() => void} [onSecondaryAction] - Handler for secondary button click
 */

/**
 * A card component for the Next Steps List widget
 * @param {NextStepsListCardProps} props
 */
export function NextStepsListCard({
    title,
    description,
    primaryButtonText,
    secondaryButtonText,
    imageSrc,
    currentStep,
    totalSteps,
    onPrimaryAction,
    onSecondaryAction,
}) {
    return (
        <div class={styles.wrapper}>
            <div class={styles.card}>
                <div class={styles.imageContainer}>{imageSrc && <img src={imageSrc} alt="" class={styles.image} />}</div>
                <div class={styles.content}>
                    <h3 class={styles.title}>{title}</h3>
                    <p class={styles.description}>{description}</p>
                    <div class={styles.buttonRow}>
                        <Button variant="accentBrand" size="lg" onClick={onPrimaryAction}>
                            {primaryButtonText}
                        </Button>
                        <Button variant="standard" size="lg" onClick={onSecondaryAction}>
                            {secondaryButtonText}
                        </Button>
                    </div>
                </div>
            </div>
            <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
        </div>
    );
}

/**
 * @param {object} props
 * @param {number} props.currentStep - Current step (1-based)
 * @param {number} props.totalSteps - Total number of steps
 */
function ProgressIndicator({ currentStep, totalSteps }) {
    const pills = [];
    for (let i = 1; i <= totalSteps; i++) {
        pills.push(<div key={i} class={cn(styles.pill, { [styles.active]: i <= currentStep })} aria-hidden="true" />);
    }

    return (
        <div class={styles.progressContainer}>
            <span class={styles.progressText}>
                {currentStep}/{totalSteps}
            </span>
            <div class={styles.progressPills}>{pills}</div>
        </div>
    );
}
