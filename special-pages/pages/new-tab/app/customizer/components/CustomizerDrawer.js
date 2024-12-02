import { h } from 'preact';
import styles from './CustomizerDrawer.module.css';
import { Suspense, lazy } from 'preact/compat';
import { useDrawerControls } from '../../components/Drawer.js';
import { useEffect } from 'preact/hooks';

// eslint-disable-next-line promise/prefer-await-to-then
const CustomizerDrawerInner = lazy(() => import('./CustomizerDrawerInner').then((x) => x.CustomizerDrawerInner));

/**
 * @param {object} props
 * @param {object} props.onClose
 * @param {object} props.wrapperRef
 * @param {import("@preact/signals").Signal<boolean>} props.displayChildren
 */
export function CustomizerDrawer({ onClose, displayChildren }) {
    const { open, close } = useDrawerControls();
    useEffect(() => {
        const checker = () => {
            const shouldOpen = window.location.hash.startsWith('#/customizer');
            console.log({ shouldOpen });
            if (shouldOpen) {
                open();
            } else {
                close();
            }
        };
        // check once on page load
        checker();

        window.addEventListener('hashchange', checker);

        return () => {
            window.removeEventListener('hashchange', checker);
        };
    }, []);
    return (
        <div class={styles.root}>
            <button onClick={onClose}>Close</button>
            {displayChildren.value && (
                <Suspense fallback={<div>Loading...</div>}>
                    <CustomizerDrawerInner />
                </Suspense>
            )}
        </div>
    );
}
