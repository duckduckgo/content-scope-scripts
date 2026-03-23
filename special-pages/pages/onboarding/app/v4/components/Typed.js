import { h } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';

import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { GlobalContext } from '../../global';

/**
 * Character-by-character typing component for v4 onboarding.
 *
 * Renders as an inline <span> so it works inside elements with text-box-trim.
 * Supports startDelay for coordinating with bubble fade-in animations.
 *
 * @param {Object} props
 * @param {string} props.text - The text to type out.
 * @param {(() => void) | null} [props.onComplete=null] - Called when typing finishes.
 * @param {boolean} [props.paused=false] - Pauses typing.
 * @param {number} [props.delay=20] - Delay (ms) between each character.
 * @param {number} [props.startDelay=0] - Delay (ms) before typing begins.
 */
export function Typed({ text, onComplete = null, paused = false, delay = 20, startDelay = 0, ...rest }) {
    const globalState = useContext(GlobalContext);
    const { activeStep } = globalState;
    const pre = useRef(/** @type {string|undefined} */ (undefined));
    useEffect(() => {
        if (activeStep && pre.current) {
            if (text === pre.current) {
                onComplete?.();
                return;
            }
        }
        pre.current = text;
    }, [activeStep, text]);
    return <TypedInner key={text} text={text} onComplete={onComplete} paused={paused} delay={delay} startDelay={startDelay} {...rest} />;
}

function TypedInner({ text, onComplete, paused, delay, startDelay, ...rest }) {
    const { isReducedMotion } = useEnv();
    const [complete, setLocalComplete] = useState(false);
    const [waiting, setWaiting] = useState(startDelay > 0 && !isReducedMotion);

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!waiting) return;
        const timer = setTimeout(() => setWaiting(false), startDelay);
        return () => clearTimeout(timer);
    }, [waiting, startDelay]);

    function localOnComplete() {
        onComplete?.();
        setLocalComplete(true);
    }

    useEffect(() => {
        if (isReducedMotion && !complete) {
            setCurrentIndex(text.length);
            localOnComplete();
        }
    }, [isReducedMotion, complete]);

    useEffect(() => {
        if (paused || waiting) return () => {};

        const controller = new AbortController();
        let enabled = true;

        document.body.addEventListener(
            'pointerdown',
            (e) => {
                let clickedElement = /** @type {HTMLElement|null} */ (e.target);
                let level = 0;
                const maxLevels = 3;

                while (clickedElement && level < maxLevels) {
                    if (clickedElement.matches('button')) {
                        return;
                    }
                    clickedElement = clickedElement.parentElement;
                    level += 1;
                }

                setCurrentIndex(text.length);
                enabled = false;
            },
            { signal: controller.signal },
        );

        if (currentIndex < text.length) {
            const timeout = setTimeout(
                () => {
                    if (!enabled) return;
                    setCurrentIndex((prevIndex) => prevIndex + 1);
                },
                text[currentIndex] === '\n' ? delay * 10 : delay,
            );
            return () => {
                clearTimeout(timeout);
                controller.abort();
            };
        } else {
            localOnComplete();
            return () => controller.abort();
        }
    }, [currentIndex, delay, text, paused, waiting]);

    const currentText = text.slice(0, currentIndex);
    const remainingText = text.slice(currentIndex);

    return (
        <span aria-label={text} {...rest}>
            {currentText}
            {remainingText && (
                <span style={{ visibility: 'hidden' }} aria-hidden="true">
                    {remainingText}
                </span>
            )}
        </span>
    );
}
