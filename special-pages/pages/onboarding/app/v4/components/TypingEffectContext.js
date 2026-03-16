import { h, createContext } from 'preact';
import { useState, useEffect, useContext, useCallback, useMemo } from 'preact/hooks';
import { GlobalContext } from '../../global';

/** @type {'none' | 'title'} */
const typingEffect = new URLSearchParams(window.location.search).get('typingEffect') === 'title' ? 'title' : 'none';

/** @type {number} Bubble fade-in delay (400ms) + duration (267ms) + brief pause before typing begins */
const TYPING_START_DELAY = 800;

/**
 * @typedef {object} TypingEffectContextValue
 * @property {'none' | 'title'} typingEffect
 * @property {boolean} isTyping
 * @property {boolean} titleComplete
 * @property {boolean} typingPaused
 * @property {boolean} hideContent
 * @property {() => void} onTitleComplete
 */

const TypingEffectContext = createContext(
    /** @type {TypingEffectContextValue} */ ({
        typingEffect: 'none',
        isTyping: false,
        titleComplete: true,
        typingPaused: false,
        hideContent: false,
        onTitleComplete: () => {},
    }),
);

/**
 * @returns {TypingEffectContextValue}
 */
export function useTypingEffect() {
    return useContext(TypingEffectContext);
}

/**
 * Provides typing effect state that resets on step transitions.
 * When typingEffect is 'none', titleComplete is always true.
 *
 * @param {object} props
 * @param {import('preact').ComponentChild} props.children
 */
export function TypingEffectProvider({ children }) {
    const { activeStep } = useContext(GlobalContext);
    const [titleComplete, setTitleComplete] = useState(typingEffect === 'none');
    const [typingPaused, setTypingPaused] = useState(typingEffect === 'title');
    const [prevActiveStep, setPrevActiveStep] = useState(activeStep);

    // Synchronous reset on step change — prevents flash of stale state
    if (prevActiveStep !== activeStep) {
        setPrevActiveStep(activeStep);
        setTitleComplete(typingEffect === 'none');
        if (typingEffect === 'title') {
            setTypingPaused(true);
        }
    }

    // Delayed unpause for typing start
    useEffect(() => {
        if (typingEffect !== 'title') return;
        const timer = setTimeout(() => setTypingPaused(false), TYPING_START_DELAY);
        return () => clearTimeout(timer);
    }, [activeStep]);

    const onTitleComplete = useCallback(() => {
        setTitleComplete(true);
    }, []);

    const isTyping = typingEffect === 'title';

    const value = useMemo(
        () => ({
            typingEffect,
            isTyping,
            titleComplete,
            typingPaused,
            hideContent: isTyping && !titleComplete,
            onTitleComplete,
        }),
        [titleComplete, typingPaused, onTitleComplete],
    );

    return <TypingEffectContext.Provider value={value}>{children}</TypingEffectContext.Provider>;
}
