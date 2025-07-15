import { h } from 'preact';
import styles from './Container.module.css';
import { useRef, useLayoutEffect, useState } from 'preact/hooks';

/**
 * @param {object} props
 * @param {boolean} props.overflow
 * @param {import('preact').ComponentChildren} props.children
 */
export function Container({ overflow, children }) {
    const contentRef = useRef(/** @type {HTMLDivElement|null} */ (null));
    const initialHeight = useRef(/** @type {number|null} */ (null));
    const [contentHeight, setContentHeight] = useState(/** @type {number|null} */ (null));

    useLayoutEffect(() => {
        const content = contentRef.current;
        if (!content) return;

        initialHeight.current = content.scrollHeight;
        setContentHeight(content.scrollHeight);

        const resizeObserver = new ResizeObserver(() => setContentHeight(content.scrollHeight));
        resizeObserver.observe(content);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div class={styles.outer} style={{ height: overflow && initialHeight.current ? initialHeight.current : 'auto' }}>
            <div class={styles.inner} style={{ height: contentHeight ?? 'auto' }}>
                <div ref={contentRef}>{children}</div>
            </div>
        </div>
    );
}
