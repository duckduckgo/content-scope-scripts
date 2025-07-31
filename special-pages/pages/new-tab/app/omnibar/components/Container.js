import cn from 'classnames';
import { h } from 'preact';
import styles from './Container.module.css';
import { useRef, useLayoutEffect, useState } from 'preact/hooks';

/**
 * @param {object} props
 * @param {'search'|'ai'} props.mode
 * @param {boolean} [props.focusRing]
 * @param {import('preact').ComponentChildren} props.suggestions
 * @param {import('preact').ComponentChildren} props.children
 */
export function Container({ mode, focusRing, suggestions, children }) {
    const { contentRef, currentHeight } = useContentHeight();
    return (
        <div class={styles.root} style={{ height: mode === 'search' ? 40 : 80 }}>
            <div class={styles.outer}>
                <div
                    class={cn(styles.inner, {
                        [styles.focusRing]: focusRing === true,
                        [styles.noFocusRing]: focusRing === false,
                    })}
                    style={{ height: currentHeight ?? 'auto' }}
                >
                    <div ref={contentRef}>{children}</div>
                </div>
                {suggestions}
            </div>
        </div>
    );
}

function useContentHeight() {
    const contentRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const [currentHeight, setCurrentHeight] = useState(/** @type {number|null} */ (null));

    useLayoutEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        setCurrentHeight(content.scrollHeight);

        const resizeObserver = new ResizeObserver(() => setCurrentHeight(content.scrollHeight));
        resizeObserver.observe(content);
        return () => resizeObserver.disconnect();
    }, []);

    return { contentRef, currentHeight };
}
