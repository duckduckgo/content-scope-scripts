import { h } from 'preact';
import { useCallback, useContext, useEffect, useReducer, useRef } from 'preact/hooks';
import cn from 'classnames';
import { GlobalDispatch } from '../../global';
import { useTypedTranslation } from '../../types';
import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { Button } from './Button';
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
 */
export function DuckPlayerContent({ isAdFree }) {
    if (isAdFree) {
        return <DuckPlayerAdFree />;
    }
    return <DuckPlayerDefault />;
}

/**
 * Ad-free variant: static promo image + Next button.
 */
function DuckPlayerAdFree() {
    const { t } = useTypedTranslation();
    const dispatch = useContext(GlobalDispatch);

    const advance = () => dispatch({ kind: 'enqueue-next' });

    return (
        <div class={styles.root}>
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
        </div>
    );
}

/**
 * @typedef {'initial'
 *   | 'toWithDuckPlayer' | 'toWithDuckPlayerThenReverse'
 *   | 'withDuckPlayer'
 *   | 'toWithoutDuckPlayer' | 'toWithoutDuckPlayerThenReverse'
 *   | 'withoutDuckPlayer'
 * } DPState
 *
 * @typedef {'toggle' | 'videoEnded' | 'autoPlay'} DPAction
 */

/**
 * State machine for video playback:
 *
 * ```
 *   initial ──[auto-play]─────────────────────▶ toWithDuckPlayer
 *   initial ──[toggle]────────────────────────▶ toWithoutDuckPlayer
 *
 *   toWithDuckPlayer ──[video ended]──────────▶ withDuckPlayer
 *   toWithDuckPlayer ──[toggle]───────────────▶ toWithDuckPlayerThenReverse
 *   toWithDuckPlayerThenReverse ──[toggle]────▶ toWithDuckPlayer
 *   toWithDuckPlayerThenReverse ──[ended]─────▶ toWithoutDuckPlayer
 *
 *   withDuckPlayer ──[toggle]─────────────────▶ toWithoutDuckPlayer
 *   toWithoutDuckPlayer ──[video ended]───────▶ withoutDuckPlayer
 *   toWithoutDuckPlayer ──[toggle]────────────▶ toWithoutDuckPlayerThenReverse
 *   toWithoutDuckPlayerThenReverse ──[toggle]─▶ toWithoutDuckPlayer
 *   toWithoutDuckPlayerThenReverse ──[ended]──▶ toWithDuckPlayer
 *
 *   withoutDuckPlayer ──[toggle]──────────────▶ toWithDuckPlayer
 * ```
 *
 * The `ThenReverse` states handle mid-playback toggles: instead of cutting
 * the video short, the current clip finishes and then the reverse plays.
 *
 * @type {(state: DPState, action: DPAction) => DPState}
 */
function videoReducer(state, action) {
    switch (state) {
        case 'initial':
            if (action === 'autoPlay') return 'toWithDuckPlayer';
            if (action === 'toggle') return 'toWithoutDuckPlayer';
            return state;
        case 'toWithDuckPlayer':
            if (action === 'videoEnded') return 'withDuckPlayer';
            if (action === 'toggle') return 'toWithDuckPlayerThenReverse';
            return state;
        case 'toWithDuckPlayerThenReverse':
            if (action === 'toggle') return 'toWithDuckPlayer';
            if (action === 'videoEnded') return 'toWithoutDuckPlayer';
            return state;
        case 'withDuckPlayer':
            if (action === 'toggle') return 'toWithoutDuckPlayer';
            return state;
        case 'toWithoutDuckPlayer':
            if (action === 'videoEnded') return 'withoutDuckPlayer';
            if (action === 'toggle') return 'toWithoutDuckPlayerThenReverse';
            return state;
        case 'toWithoutDuckPlayerThenReverse':
            if (action === 'toggle') return 'toWithoutDuckPlayer';
            if (action === 'videoEnded') return 'toWithDuckPlayer';
            return state;
        case 'withoutDuckPlayer':
            if (action === 'toggle') return 'toWithDuckPlayer';
            return state;
        default:
            return state;
    }
}

/**
 * Default variant: mp4 video transition with before/after toggle + Next button.
 */
function DuckPlayerDefault() {
    const { t } = useTypedTranslation();
    const { isReducedMotion } = useEnv();
    const globalDispatch = useContext(GlobalDispatch);

    const withVideoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));
    const withoutVideoRef = useRef(/** @type {HTMLVideoElement | null} */ (null));

    /**
     * Play a video, or seek to end if reduced-motion is preferred.
     * @param {HTMLVideoElement | null} video
     */
    const playVideo = (video) => {
        if (!video) return;
        if (isReducedMotion) {
            if (Number.isFinite(video.duration)) {
                video.currentTime = video.duration;
            }
            return;
        }
        video.currentTime = 0;
        video.play();
    };

    const [state, dispatch] = useReducer(videoReducer, 'initial');

    const send = useCallback(
        /** @param {DPAction} action */
        (action) => {
            const next = videoReducer(state, action);
            // Only play video if not canceling a reverse (video is already playing)
            if (next === 'toWithDuckPlayer' && state !== 'toWithDuckPlayerThenReverse') {
                playVideo(withVideoRef.current);
            }
            if (next === 'toWithoutDuckPlayer' && state !== 'toWithoutDuckPlayerThenReverse') {
                playVideo(withoutVideoRef.current);
            }
            dispatch(action);
        },
        [state],
    );

    // Auto-play after bubble entry animation (400ms delay + 267ms duration = 667ms)
    useEffect(() => {
        const id = setTimeout(() => send('autoPlay'), isReducedMotion ? 0 : 667);
        return () => clearTimeout(id);
    }, [send, isReducedMotion]);

    const advance = () => globalDispatch({ kind: 'enqueue-next' });

    const isWithVideoShown = ['initial', 'toWithDuckPlayer', 'toWithDuckPlayerThenReverse', 'withDuckPlayer'].includes(state);
    const isHideTextShown = ['initial', 'withDuckPlayer', 'toWithDuckPlayer', 'toWithoutDuckPlayerThenReverse'].includes(state);

    return (
        <div class={styles.root}>
            <div class={styles.videoContainer}>
                <video
                    ref={withVideoRef}
                    class={cn(styles.video, { [styles.hidden]: !isWithVideoShown })}
                    src="assets/videos/duck-player-enabled.mp4"
                    muted
                    playsInline
                    preload="auto"
                    onEnded={() => send('videoEnded')}
                />
                <video
                    ref={withoutVideoRef}
                    class={cn(styles.video, { [styles.hidden]: isWithVideoShown })}
                    src="assets/videos/duck-player-disabled.mp4"
                    muted
                    playsInline
                    preload="auto"
                    onEnded={() => send('videoEnded')}
                />
            </div>
            <div class={styles.actions}>
                <Button variant="secondary" class={styles.toggleButton} onClick={() => send('toggle')}>
                    {isHideTextShown ? t('beforeAfter_duckPlayer_hide') : t('beforeAfter_duckPlayer_show')}
                </Button>
                <Button variant="primary" class={styles.nextButton} onClick={advance}>
                    {t('nextButton')}
                </Button>
            </div>
        </div>
    );
}
