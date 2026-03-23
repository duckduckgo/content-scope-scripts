import { h } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';

import { useEnv } from '../../../../../shared/components/EnvironmentProvider';
import { GlobalContext } from '../../global';

/**
 * Character-by-character typing component for v4 onboarding.
 *
 * @param {Object} props
 * @param {string} props.text - The text to type out.
 * @param {(() => void) | null} [props.onComplete=null] - Called when typing finishes.
 * @param {number} [props.delay=20] - Delay (ms) between each character.
 * @param {number} [props.startDelay=0] - Delay (ms) before typing begins.
 */
export function Typed({ text, onComplete = null, delay = 20, startDelay = 0, ...rest }) {
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
    return <TypedInner key={text} text={text} onComplete={onComplete} delay={delay} startDelay={startDelay} {...rest} />;
}

function TypedInner({ text, onComplete, delay, startDelay, ...rest }) {
    const { isReducedMotion } = useEnv();
    const [waiting, setWaiting] = useState(startDelay > 0 && !isReducedMotion);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!waiting) return;
        const timer = setTimeout(() => setWaiting(false), startDelay);
        return () => clearTimeout(timer);
    }, [waiting, startDelay]);

    useEffect(() => {
        if (waiting) return;

        if (isReducedMotion) {
            setCurrentIndex(text.length);
            onComplete?.();
            return;
        }

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
            onComplete?.();
            return () => controller.abort();
        }
    }, [currentIndex, delay, text, waiting]);

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
