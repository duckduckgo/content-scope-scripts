import { h } from 'preact';
import { useContext, useRef, useState } from 'preact/hooks';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { ComparisonTable } from './ComparisonTable';
import { Button } from './Button';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import styles from './MakeDefaultContent.module.css';

/**
 * Top bubble content for the makeDefaultSingle step.
 * Shows title (changes after user makes default), comparison table, and Skip/Make Default buttons.
 */
export function MakeDefaultContent() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);
    const { isReducedMotion } = useEnv();
    const titleRef = useRef(/** @type {HTMLHeadingElement|null} */ (null));
    const skipButtonRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const makeDefaultButtonRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const [titleText, setTitleText] = useState(t('protectionsActivated_title'));
    const [buttonText, setButtonText] = useState(t('makeDefaultButton'));
    const [showSkipButton, setShowSkipButton] = useState(true);

    const advance = () => dispatch({ kind: 'enqueue-next' });

    const enableDefaultBrowser = async () => {
        dispatch({
            kind: 'update-system-value',
            id: 'default-browser',
            payload: { enabled: true },
            current: true,
        });

        const title = titleRef.current;
        const skipButton = skipButtonRef.current;
        const makeDefaultButton = makeDefaultButtonRef.current;
        const actionsContainer = skipButton?.parentElement;
        if (!title || !skipButton || !makeDefaultButton || !actionsContainer) {
            throw new Error('MakeDefaultContent refs not attached');
        }

        if (isReducedMotion) {
            setTitleText(t('makeDefaultAccept_title_v4'));
            setButtonText(t('nextButton'));
            setShowSkipButton(false);
            return;
        }

        // FLIP: record positions before layout change
        const skipButtonRect = skipButton.getBoundingClientRect();
        const actionsContainerRect = actionsContainer.getBoundingClientRect();
        const makeDefaultButtonStartRect = makeDefaultButton.getBoundingClientRect();

        // Remove skipButton from flow, fixing it at its current visual position
        skipButton.style.position = 'absolute';
        skipButton.style.left = `${skipButtonRect.left - actionsContainerRect.left}px`;
        skipButton.style.top = `${skipButtonRect.top - actionsContainerRect.top}px`;
        skipButton.style.width = `${skipButtonRect.width}px`;

        // Measure where makeDefaultButton lands after reflow
        const makeDefaultButtonEndRect = makeDefaultButton.getBoundingClientRect();
        const makeDefaultButtonDeltaX = makeDefaultButtonStartRect.left - makeDefaultButtonEndRect.left;

        // Lock button width so the text swap doesn't cause a size change mid-animation
        const makeDefaultButtonInner = /** @type {HTMLElement} */ (makeDefaultButton.firstElementChild);
        makeDefaultButtonInner.style.width = `${makeDefaultButtonInner.offsetWidth}px`;

        setButtonText(t('nextButton'));

        // Title bounce
        const titleBounceAnimation = (async () => {
            const scaleUp = title.animate([{ scale: 1 }, { scale: 1.07 }], {
                duration: 233,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            });
            await scaleUp.finished;
            setTitleText(t('makeDefaultAccept_title_v4'));
            const scaleDown = title.animate([{ scale: 1.07 }, { scale: 1 }], {
                duration: 233,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            });
            await scaleDown.finished;
        })();

        // Skip fade (fill: forwards keeps opacity at 0 until DOM cleanup)
        const skipButtonFadeAnimation = skipButton.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards',
        }).finished;

        // Button slide to center
        const makeDefaultButtonSlideAnimation = makeDefaultButton.animate(
            [{ transform: `translateX(${makeDefaultButtonDeltaX}px)` }, { transform: 'translateX(0)' }],
            {
                duration: 300,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            },
        ).finished;

        // Run all animations at same time, then unmount skip button
        await Promise.all([titleBounceAnimation, skipButtonFadeAnimation, makeDefaultButtonSlideAnimation]);
        setShowSkipButton(false);
    };

    return (
        <div class={styles.root}>
            <h2 ref={titleRef} class={styles.title}>
                {titleText}
            </h2>

            <ComparisonTable />

            <div class={styles.actions}>
                {showSkipButton && (
                    <div ref={skipButtonRef} class={styles.skipButton}>
                        <Button variant="secondary" size="stretch" onClick={advance}>
                            {t('skipButton')}
                        </Button>
                    </div>
                )}
                <div ref={makeDefaultButtonRef}>
                    <Button onClick={showSkipButton ? enableDefaultBrowser : advance}>{buttonText}</Button>
                </div>
            </div>
        </div>
    );
}
