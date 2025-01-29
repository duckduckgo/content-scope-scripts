import { h } from 'preact';
import cn from 'classnames';
import styles from './Player.module.css';
import { useEffect, useRef } from 'preact/hooks';
import { useSettings } from '../providers/SettingsProvider.jsx';
import { createIframeFeatures } from '../features/iframe.js';
import { Settings } from '../settings';
import { useTypedTranslation } from '../types.js';

export const PLAYER_ERRORS = {
    invalidId: 'invalid-id',
    botDetected: 'bot-detected',
    ageRestricted: 'age-restricted',
    noEmbed: 'no-embed',
};

export const PLAYER_ERROR_IDS = Object.values(PLAYER_ERRORS);

/**
 * @typedef {'invalid-id'|'bot-detected'|'age-restricted'|'no-embed'} PlayerError
 */

/**
 * Player component renders an embedded media player.
 *
 * @param {object} props
 * @param {string} props.src - The source URL of the media to be played.
 * @param {Settings['layout']} props.layout
 */
export function Player({ src, layout }) {
    const { ref, didLoad } = useIframeEffects(src);
    const wrapperClasses = cn({
        [styles.root]: true,
        [styles.player]: true,
        [styles.desktop]: layout === 'desktop',
        [styles.mobile]: layout === 'mobile',
    });
    const iframeClasses = cn({
        [styles.iframe]: true,
        [styles.desktop]: layout === 'desktop',
        [styles.mobile]: layout === 'mobile',
    });
    return (
        <div class={wrapperClasses}>
            <iframe
                class={iframeClasses}
                frameBorder="0"
                id="player"
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-popups allow-scripts allow-same-origin allow-popups-to-escape-sandbox"
                src={src}
                ref={ref}
                onLoad={didLoad}
            />
        </div>
    );
}

/**
 * @param {PlayerError} kind
 * @returns {{heading: Element, message: Element, solutions: Element[]}}
 */
function useErrorStrings(kind) {
    const { t } = useTypedTranslation();
    const headingsMap = {
        ['invalid-id']: <span dangerouslySetInnerHTML={{ __html: t('invalidIdError') }} />,
        ['bot-detected']: <span dangerouslySetInnerHTML={{ __html: t('botDetectedError') }} />,
        ['age-restricted']: <span dangerouslySetInnerHTML={{ __html: t('blockedVideoError') }} />,
    };
    const solutionsMap = {
        ['invalid-id']: [],
        ['bot-detected']: [
            <span dangerouslySetInnerHTML={{ __html: t('botDetectedErrorTip1') }} />,
            <span dangerouslySetInnerHTML={{ __html: t('botDetectedErrorTip2') }} />,
        ],
    };
    const messageMap = {
        ['invalid-id']: '',
        ['age-restricted']: <span dangerouslySetInnerHTML={{ __html: t('blockedVideoErrorMessage') }} />,
    };

    const heading = headingsMap[kind] || headingsMap['invalid-id'];
    const solutions = solutionsMap[kind] || solutionsMap['invalid-id'];
    const message = messageMap[kind] || messageMap['invalid-id'];
    return { heading, message, solutions };
}

/**
 * @param {object} props
 * @param {Settings['layout']} props.layout
 * @param {PlayerError} props.kind
 */
export function PlayerError({ kind, layout }) {
    return (
        <div
            class={cn(styles.root, {
                [styles.desktop]: layout === 'desktop',
                [styles.mobile]: layout === 'mobile',
                [styles.errorContainer]: true,
            })}
        >
            {kind === 'invalid-id' && <InvalidIdError kind={kind} />}
            {kind !== 'invalid-id' && <YouTubeError kind={kind} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {PlayerError} props.kind
 */
export function InvalidIdError({ kind }) {
    const { heading } = useErrorStrings(kind);
    const classes = cn(styles.error, styles.invalidError);

    return (
        <div className={classes}>
            <p>{heading}</p>
        </div>
    );
}

/**
 * @param {object} props
 * @param {PlayerError} props.kind
 */
export function YouTubeError({ kind }) {
    const { heading, message, solutions } = useErrorStrings(kind);
    const classes = cn(styles.error, styles.youtubeError);

    return (
        <div className={classes}>
            <div className={styles.youtubeErrorContainer}>
                <span className={styles.youtubeErrorIcon}></span>

                <div className={styles.youtubeErrorText}>
                    <h1 className={styles.youtubeErrorHeading}>{heading}</h1>

                    {message && <p className={styles.youtubeErrorMessage}>{message}</p>}

                    {solutions && (
                        <ul className={styles.youtubeErrorList}>
                            {solutions.map((item) => (
                                <li>{item}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * This is used to track the lifecycle of an iframe, and apply
 * a known list of features to it once it's loaded.
 *
 * We use 2 ways to detect if the iframe is 'ready'.
 *   1: we try an `iframe.addEventListener('load', loadHandler);`
 *   2: we look if it already loaded (can happen with caching) via an onLoad handler
 *      in the parent that called this.
 *
 * When either event occurs, we proceed to apply our list of features.
 *
 * @param {string} src - the iframe `src` attribute
 * @return {{
 *   ref: import("preact/hooks").MutableRef<HTMLIFrameElement|null>,
 *   didLoad: () => void
 * }}
 */
function useIframeEffects(src) {
    const ref = useRef(/** @type {HTMLIFrameElement|null} */ (null));
    const didLoad = useRef(/** @type {boolean} */ (false));
    const settings = useSettings();

    useEffect(() => {
        if (!ref.current) return;
        const iframe = ref.current;
        const features = createIframeFeatures(settings);

        /** @type {import("../features/iframe.js").IframeFeature[]} */
        const iframeFeatures = [
            features.autofocus(),
            features.pip(),
            features.clickCapture(),
            features.titleCapture(),
            features.mouseCapture(),
            features.errorDetection(),
        ];

        /**
         * @type {ReturnType<import("../features/pip").IframeFeature['iframeDidLoad']>[]}
         */
        const cleanups = [];
        const loadHandler = () => {
            for (let feature of iframeFeatures) {
                try {
                    cleanups.push(feature.iframeDidLoad(iframe));
                } catch (e) {
                    console.error(e);
                }
            }
        };

        if (didLoad.current === true) {
            loadHandler();
        } else {
            iframe.addEventListener('load', loadHandler);
        }

        return () => {
            for (let cleanup of cleanups) {
                cleanup?.();
            }
            iframe.removeEventListener('load', loadHandler);
        };
    }, [src, settings]);

    return { ref, didLoad: () => (didLoad.current = true) };
}
