import { h } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';

/**
 * @param {import('preact').JSX.HTMLAttributes<HTMLDivElement>} props
 */
export function ResizingContainer(props) {
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

    return (
        <div {...props} style={{ height: currentHeight ?? 'auto' }}>
            <div ref={contentRef}>{props.children}</div>
        </div>
    );
}
