import { h } from 'preact';
import '@lottielab/lottie-player/web';
import { useEffect, useRef } from 'preact/hooks';

/**
 * BurnAnimation is a React component that renders a Lottie animation and dispatches custom events when the animation stops or the component unmounts.
 *
 * @param {Object} props The properties object.
 * @param {string} props.url The URL associated with the animation, used to identify or provide additional context in the dispatched events.
 */
export function BurnAnimation({ url }) {
    const ref = useRef(/** @type {Lottie} */ null);
    useEffect(() => {
        if (!ref.current) return;
        const curr = /** @type {import("@lottielab/lottie-player/web").default} */ (ref.current);
        let finished = false;
        const int = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('done-burning', { detail: { url, reason: 'timeout occurred' } }));
            curr.stop();
            finished = true;
        }, 1200);
        return () => {
            clearTimeout(int);
            if (!finished) {
                window.dispatchEvent(new CustomEvent('done-burning', { detail: { url, reason: 'unmount occurred' } }));
            }
        };
    }, [url]);
    // @ts-expect-error - temporary
    return <lottie-player src="burn.json" ref={ref} duration="1s"></lottie-player>;
}
