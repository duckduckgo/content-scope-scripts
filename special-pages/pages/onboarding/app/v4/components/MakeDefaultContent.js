import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { GlobalDispatch, useGlobalState } from '../../global';
import { useTypedTranslation } from '../../types';
import { ComparisonTable } from './ComparisonTable';
import { Button } from './Button';
import { useAnimate } from '../hooks/useAnimate';
import { usePresence } from '../hooks/usePresence';
import { useFlip } from '../hooks/useFlip';
import styles from './MakeDefaultContent.module.css';

/**
 * Top bubble content for the makeDefaultSingle step.
 * Shows title (changes after user makes default), comparison table, and Skip/Make Default buttons.
 */
export function MakeDefaultContent() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);
    const appState = useGlobalState();
    const { status } = appState;

    // Skip button visibility: hidden while the native call is in flight or after it succeeds
    const defaultBrowserUIValue = appState.UIValues['default-browser'];
    const isPending = status.kind === 'executing' && status.action.kind === 'update-system-value' && status.action.id === 'default-browser';
    const showSkipButton = !isPending && defaultBrowserUIValue === 'idle';

    // Title text swaps in the middle of bounce animation, so it can't be derived from global state
    const [showSuccess, setShowSuccess] = useState(false);

    // Animation hooks: usePresence (skip button fade out) must come before useFlip (make default
    // button slide) so the skip button leaves flow before useFlip measures the new layout
    /** @type {[import('preact').RefObject<HTMLHeadingElement>, import('../hooks/useAnimate').AnimateFn]} */
    const [titleRef, animateTitle] = useAnimate();
    /** @type {[import('preact').RefObject<HTMLButtonElement>, boolean]} */
    const [skipButtonRef, skipButtonMounted] = usePresence(showSkipButton, {
        keyframes: [{ opacity: 1 }, { opacity: 0 }],
        options: { duration: 300, easing: 'ease-out' },
    });
    /** @type {import('preact').RefObject<HTMLButtonElement>} */
    const makeDefaultButtonRef = useFlip({ duration: 300, easing: 'cubic-bezier(0.17, 0, 0.83, 1)' });

    // When the global state resets to idle after an error, showSkipButton becomes true again. Reset
    // local animation state to match
    if (showSuccess && showSkipButton) {
        setShowSuccess(false);
    }
    if (showSkipButton && makeDefaultButtonRef.current) {
        makeDefaultButtonRef.current.style.minWidth = '';
    }

    const advance = () => dispatch({ kind: 'enqueue-next' });

    const enableDefaultBrowser = () => {
        // Lock button width before text shrinks from "Make Default" to "Next"
        if (makeDefaultButtonRef.current) {
            makeDefaultButtonRef.current.style.minWidth = `${makeDefaultButtonRef.current.offsetWidth}px`;
        }

        dispatch({
            kind: 'update-system-value',
            id: 'default-browser',
            payload: { enabled: true },
            current: true,
        });

        // Fire-and-forget sequential title bounce (text swaps at midpoint)
        (async () => {
            await animateTitle([{ scale: 1 }, { scale: 1.07 }], {
                duration: 233,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            });
            setShowSuccess(true);
            await animateTitle([{ scale: 1.07 }, { scale: 1 }], {
                duration: 233,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            });
        })();
    };

    return (
        <div class={styles.root}>
            <h2 ref={titleRef} class={styles.title}>
                {showSuccess ? t('makeDefaultAccept_title_v4') : t('protectionsActivated_title')}
            </h2>

            <ComparisonTable />

            <div class={styles.actions}>
                {skipButtonMounted && (
                    <Button buttonRef={skipButtonRef} class={styles.skipButton} variant="secondary" onClick={advance}>
                        {t('skipButton')}
                    </Button>
                )}
                <Button buttonRef={makeDefaultButtonRef} disabled={isPending} onClick={showSkipButton ? enableDefaultBrowser : advance}>
                    {showSkipButton ? t('makeDefaultButton') : t('nextButton')}
                </Button>
            </div>
        </div>
    );
}
