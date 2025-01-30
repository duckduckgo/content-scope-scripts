import { useEffect, useState } from 'preact/hooks';

/**
 * Use this to verify the result of updating some local state.
 *
 * @template TState
 * @template TEvent
 * @param {string} name
 * @param {TState} state
 * @param {TEvent} event
 * @param {(s: TState, e: TEvent) => TState} reducer
 */
export function log(name, state, event, reducer) {
    if (window.__playwright_01) {
        return reducer(state, event);
    }
    console.group(`[${name}]`);
    console.log('  [incoming]', state, event);
    const next = reducer(state, event);
    console.log('      [next]', next);
    console.groupEnd();
    return next;
}

/**
 * Use this as a temporary debugger.
 *
 * ```js diff
 * - const [state, dispatch] = useReducer(reducer, initial)
 * + const [state, dispatch] = useReducer(withLog('my name', reducer), initial)
 * ```
 *
 * @template TState
 * @template TEvent
 * @template {(a: TState, b: TEvent) => TState} T
 * @param {string} name
 * @param {T} reducer
 * @param reducer
 * @return {(a: TState, b: TEvent) => TState}
 */
export function withLog(name, reducer) {
    return (state, event) => log(name, state, event, reducer);
}

/**
 * @param {(...args: any[]) => void} fn
 */
export function viewTransition(fn) {
    if ('startViewTransition' in document && typeof document.startViewTransition === 'function') {
        return document.startViewTransition(fn);
    }
    return fn();
}

/**
 *
 */
export function noop(named) {
    return () => {
        console.log(named, 'noop');
    };
}

/**
 * @param {MouseEvent} event
 * @param {ImportMeta['platform']} platformName
 * @return {import("../types/new-tab").OpenTarget}
 */
export function eventToTarget(event, platformName) {
    const isControlClick = platformName === 'macos' ? event.metaKey : event.ctrlKey;
    if (isControlClick) {
        return 'new-tab';
    } else if (event.shiftKey || event.button === 1 /* middle click */) {
        return 'new-window';
    }
    return 'same-tab';
}

export function useDocumentVisibility() {
    /** @type {Document['visibilityState']} */
    const initial = document.visibilityState;
    const [documentVisibility, setDocumentVisibility] = useState(/** @type {Document['visibilityState']} */ (initial));

    useEffect(() => {
        const handleVisibilityChange = () => {
            setDocumentVisibility(document.visibilityState);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return documentVisibility;
}

/**
 * Custom hook to handle auxclick event on an element.
 * @param {import('preact').RefObject<HTMLElement>} ref - The ref of the element to attach the event listener to.
 * @param {Function} handler - The function to execute on auxclick event.
 */
export function useAuxClick(ref, handler) {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleAuxClick = (event) => handler(event);

        element.addEventListener('auxclick', handleAuxClick);

        return () => {
            element.removeEventListener('auxclick', handleAuxClick);
        };
    }, [ref, handler]);
}