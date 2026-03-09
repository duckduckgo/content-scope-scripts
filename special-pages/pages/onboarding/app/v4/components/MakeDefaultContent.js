import { h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useGlobalState } from '../../global';
import { useTypedTranslation } from '../../types';
import { ComparisonTable } from './ComparisonTable';
import { Button } from './Button';
import { Container } from './Container';
import { Title } from './Title';
import { LottieAnimation } from './LottieAnimation';
import { useAnimate } from '../hooks/useAnimate';
import { usePresence } from '../hooks/usePresence';
import { useFlip } from '../hooks/useFlip';
import cn from 'classnames';
import styles from './MakeDefaultContent.module.css';

/**
 * Top bubble content for the makeDefaultSingle step.
 * Shows title (changes after user makes default), comparison table, and Skip/Make Default buttons.
 *
 * @param {object} props
 * @param {() => void} props.advance
 * @param {(id: import('../../types').SystemValueId, payload: import('../../types').SystemValue, current: boolean) => void} props.updateSystemValue
 */
export function MakeDefaultContent({ advance, updateSystemValue }) {
    const { t } = useTypedTranslation();
    const globalState = useGlobalState();

    // Skip button visibility: hidden while the native call is in flight or after it succeeds
    const isPending =
        globalState.status.kind === 'executing' &&
        globalState.status.action.kind === 'update-system-value' &&
        globalState.status.action.id === 'default-browser';
    const showSkipButton = !isPending && globalState.UIValues['default-browser'] === 'idle';

    // Title text swaps mid-bounce so it can't be derived from global state
    const [showSuccess, setShowSuccess] = useState(false);

    /** @type {import('preact').RefObject<import('lottie-web').AnimationItem | null>} */
    const sparkleRef = useRef(null);

    // Hook order matters: usePresence removes the skip button from flow before useFlip measures layout
    /** @type {[import('preact').RefObject<HTMLHeadingElement>, import('../hooks/useAnimate').AnimateFn]} */
    const [titleRef, animateTitle] = useAnimate();

    /** @type {[import('preact').RefObject<HTMLButtonElement>, boolean]} */
    const [skipButtonRef, skipButtonMounted] = usePresence(showSkipButton, {
        keyframes: [{ opacity: 1 }, { opacity: 0 }],
        options: { duration: 300, easing: 'ease-out' },
    });

    /** @type {import('preact').RefObject<HTMLButtonElement>} */
    const primaryButtonRef = useFlip({ duration: 300, easing: 'cubic-bezier(0.17, 0, 0.83, 1)' });

    // Reset local animation state when global state returns to idle after an error
    if (showSuccess && showSkipButton) setShowSuccess(false);
    if (showSkipButton && primaryButtonRef.current) primaryButtonRef.current.style.minWidth = '';

    const enableDefaultBrowser = () => {
        // Lock button width before text shrinks from "Make Default" to "Next"
        if (primaryButtonRef.current) {
            primaryButtonRef.current.style.minWidth = `${primaryButtonRef.current.offsetWidth}px`;
        }

        updateSystemValue('default-browser', { enabled: true }, true);

        // Fire-and-forget sequential title bounce (text swaps at midpoint)
        (async () => {
            await animateTitle([{ scale: 1 }, { scale: 1.07 }], {
                duration: 233,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            });
            setShowSuccess(true);
            sparkleRef.current?.goToAndPlay(6, true);
            await animateTitle([{ scale: 1.07 }, { scale: 1 }], {
                duration: 233,
                easing: 'cubic-bezier(0.17, 0, 0.83, 1)',
            });
        })();
    };

    return (
        <Container class={styles.root}>
            <div class={styles.titleContainer}>
                <Title titleRef={titleRef} class={styles.title}>
                    {showSuccess ? t('makeDefaultAccept_title_v4') : t('protectionsActivated_title')}
                </Title>
                <LottieAnimation
                    src="assets/lottie/v4/sparkle.json"
                    darkSrc="assets/lottie/v4/sparkle-dark.json"
                    class={cn(styles.sparkle, { [styles.hidden]: !showSuccess })}
                    width={34}
                    height={43}
                    autoplay={false}
                    animationRef={sparkleRef}
                />
            </div>

            <ComparisonTable />

            <div class={styles.actions}>
                {skipButtonMounted && (
                    <Button buttonRef={skipButtonRef} class={styles.skipButton} variant="secondary" onClick={advance}>
                        {t('skipButton')}
                    </Button>
                )}
                <Button buttonRef={primaryButtonRef} disabled={isPending} onClick={showSkipButton ? enableDefaultBrowser : advance}>
                    {showSkipButton ? t('makeDefaultButton') : t('nextButton')}
                </Button>
            </div>
        </Container>
    );
}
