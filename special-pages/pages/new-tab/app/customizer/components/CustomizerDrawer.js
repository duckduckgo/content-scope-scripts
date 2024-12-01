import { h } from 'preact';
import styles from './CustomizerDrawer.module.css';
import { Suspense, lazy } from 'preact/compat';

// eslint-disable-next-line promise/prefer-await-to-then
const CustomizerDrawerInner = lazy(() => import('./CustomizerDrawerInner').then((x) => x.CustomizerDrawerInner));

/**
 * @param {object} props
 * @param {object} props.onClose
 * @param {object} props.wrapperRef
 * @param {import("@preact/signals").Signal<boolean>} props.displayChildren
 */
export function CustomizerDrawer({ onClose, displayChildren }) {
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
