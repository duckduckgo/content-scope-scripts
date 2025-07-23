import cn from 'classnames';
import { h } from 'preact';
import styles from './Container.module.css';
import { useRef, useLayoutEffect, useState } from 'preact/hooks';

/**
 * @param {object} props
 * @param {boolean} props.overflow
 * @param {import('preact').ComponentChildren} props.children
 */
export function Container({ overflow, children }) {
    const [hasFocus, setHasFocus] = useState(false);
    const { contentRef, initialHeight, currentHeight } = useContentHeight();
    return (
        <div
            class={cn(styles.outer, { [styles.focused]: hasFocus })}
            style={{ height: overflow && initialHeight ? initialHeight : 'auto' }}
            onFocus={() => setHasFocus(true)}
            onBlur={() => setHasFocus(false)}
            onInput={() => setHasFocus(false)}
        >
            <div class={styles.inner} style={{ height: currentHeight ?? 'auto' }}>
                <div ref={contentRef}>{children}</div>
            </div>
        </div>
    );
}

function useContentHeight() {
    const contentRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const initialHeight = useRef(/** @type {number|null} */ (null));
    const [currentHeight, setCurrentHeight] = useState(/** @type {number|null} */ (null));

    useLayoutEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        initialHeight.current = content.scrollHeight;
        setCurrentHeight(content.scrollHeight);

        const resizeObserver = new ResizeObserver(() => setCurrentHeight(content.scrollHeight));
        resizeObserver.observe(content);
        return () => resizeObserver.disconnect();
    }, []);

    return { contentRef, initialHeight: initialHeight.current, currentHeight };
}
