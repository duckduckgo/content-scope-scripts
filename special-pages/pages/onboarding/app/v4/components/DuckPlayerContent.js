import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslation } from '../../types';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { Button } from './Button';
import { Container } from './Container';
import { LottieAnimation } from './LottieAnimation';
import styles from './DuckPlayerContent.module.css';

/**
 * Bottom bubble content for the duckPlayerSingle step.
 *
 * - variant 'ad-free': static promo image + single Next button
 * - default (no variant): Rive animation with before/after toggle + Next button
 *
 * @param {object} props
 * @param {boolean} props.isAdFree
 * @param {() => void} props.advance
 */
export function DuckPlayerContent({ isAdFree, advance }) {
    return isAdFree ? <DuckPlayerAdFree advance={advance} /> : <DuckPlayerDefault advance={advance} />;
}

/**
 * Ad-free variant: static promo image + Next button.
 *
 * @param {object} props
 * @param {() => void} props.advance
 */
function DuckPlayerAdFree({ advance }) {
    const { t } = useTypedTranslation();
    return (
        <Container>
            <div class={styles.imageContainer}>
                <img src="assets/img/v4/duck-player-promo.svg" alt="" class={styles.promoImage} />
                <LottieAnimation
                    src="assets/lottie/v4/sparkle.json"
                    darkSrc="assets/lottie/v4/sparkle-dark.json"
                    class={styles.sparkle}
                    width={34}
                    height={43}
                />
            </div>
            <Button variant="primary" size="stretch" onClick={advance}>
                {t('nextButton')}
            </Button>
        </Container>
    );
}

/**
 * @typedef {'with' | 'without'} DPTarget
 * @typedef {'initial' | 'playing' | 'settled'} DPPhase
 * @typedef {{ target: DPTarget, phase: DPPhase, reverse: boolean }} DPState
 */

/**
 * Default variant: mp4 video transition with before/after toggle + Next button.
 *
 * State is `{ target, phase, reverse }`:
 *  - target: which visual we're animating towards: "with duck player" or "without duck player"
 *  - phase: lifecycle of the current video
 *  - reverse: when true, the other video plays once the current one ends
 */
/**
 * @param {object} props
 * @param {() => void} props.advance
 */
function DuckPlayerDefault({ advance }) {
    const { t } = useTypedTranslation();
    const { isReducedMotion } = useEnv();

    const videosRef = useRef(/** @type {Record<DPTarget, HTMLVideoElement | null>} */ ({ with: null, without: null }));

    const [state, setState] = useState(/** @type {DPState} */ ({ target: 'with', phase: 'initial', reverse: false }));

    /** @type {(target: DPTarget) => DPTarget} */
    const flip = (target) => (target === 'with' ? 'without' : 'with');

    /** @param {DPTarget} target */
    const videoFor = (target) => videosRef.current[target];

    /** @param {HTMLVideoElement | null} video */
    const play = (video) => {
        if (!video) return;
        if (isReducedMotion) {
            if (Number.isFinite(video.duration)) video.currentTime = video.duration;
            return;
        }
        video.currentTime = 0;
        video.play();
    };

    /** @param {HTMLVideoElement | null} video */
    const reset = (video) => {
        if (video) video.currentTime = 0;
    };

    // Auto-play after bubble entry animation (400ms delay + 267ms duration = 667ms)
    useEffect(() => {
        const id = setTimeout(
            () => {
                play(videoFor('with'));
                setState((prev) => ({ ...prev, phase: isReducedMotion ? 'settled' : 'playing' }));
            },
            isReducedMotion ? 0 : 667,
        );
        return () => clearTimeout(id);
    }, [isReducedMotion]);

    const toggle = () => {
        const { target, phase, reverse } = state;
        if (phase === 'initial') {
            // Queue a reverse so auto-play will switch to "without" once the "with" video ends
            setState({ target, phase, reverse: true });
        } else if (phase === 'playing') {
            // Mid-playback: queue or cancel a reverse instead of cutting the video short
            if (!reverse) reset(videoFor(flip(target)));
            setState({ target, phase: 'playing', reverse: !reverse });
        } else {
            // Settled: switch to the other video
            const next = flip(target);
            play(videoFor(next));
            setState({ target: next, phase: isReducedMotion ? 'settled' : 'playing', reverse: false });
        }
    };

    const end = () => {
        if (state.reverse) {
            // A reverse was queued — play the other video now
            const next = flip(state.target);
            play(videoFor(next));
            setState({ target: next, phase: 'playing', reverse: false });
        } else {
            // No reverse — just settle on the current video
            setState((prev) => ({ ...prev, phase: 'settled' }));
        }
    };

    const toggleLabel = state.reverse ? flip(state.target) : state.target;

    return (
        <Container>
            <div class={styles.videoContainer}>
                <video
                    ref={(el) => {
                        videosRef.current.with = el;
                    }}
                    class={cn(styles.video, { [styles.hidden]: state.target !== 'with' })}
                    src="assets/videos/duck-player-enabled.mp4"
                    muted
                    playsInline
                    preload="auto"
                    onEnded={end}
                />
                <video
                    ref={(el) => {
                        videosRef.current.without = el;
                    }}
                    class={cn(styles.video, { [styles.hidden]: state.target !== 'without' })}
                    src="assets/videos/duck-player-disabled.mp4"
                    muted
                    playsInline
                    preload="auto"
                    onEnded={end}
                />
            </div>
            <div class={styles.actions}>
                <Button variant="secondary" class={styles.toggleButton} onClick={toggle}>
                    {toggleLabel === 'with' ? t('beforeAfter_duckPlayer_hide') : t('beforeAfter_duckPlayer_show')}
                </Button>
                <Button variant="primary" class={styles.nextButton} onClick={advance}>
                    {t('nextButton')}
                </Button>
            </div>
        </Container>
    );
}
