import { h } from 'preact'
import { useState, useEffect, useRef } from 'preact/hooks'

// @ts-ignore
const isReducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

export function Typed({ text, onComplete = null, delay = 5 }) {
    return <TypedInner key={text} text={text} onComplete={onComplete} delay={delay} />
}

function TypedInner({ text, onComplete, delay }) {
    // TODO test isReducedMotion
    const [currentText, setCurrentText] = useState(isReducedMotion ? text : '');
    const [currentIndex, setCurrentIndex] = useState(isReducedMotion ? text.length : 0);

    const [actualWidth, setActualWidth] = useState(0);

    const actual = useRef(null)

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setCurrentText(prevText => prevText + text[currentIndex]);
                setCurrentIndex(prevIndex => prevIndex + 1);
            }, delay);

            return () => clearTimeout(timeout);
        } else {
            onComplete && onComplete();
            return () => {}
        }
    }, [currentIndex, delay, text]);

    useEffect(() => {
        // @ts-ignore
        setActualWidth(actual.current.offsetWidth)
    }, [])

    return <div style={{position: 'relative', width: '100%', whiteSpace: 'pre-line'}} aria-label={text}>
        <span style={{visibility: 'hidden'}} ref={actual}>{text}</span>
        <span aria-hidden={false} style={{position: 'absolute', top: 0, left:0, width: actualWidth, whiteSpace: 'pre-line'}}>{currentText}</span>
    </div>;
}