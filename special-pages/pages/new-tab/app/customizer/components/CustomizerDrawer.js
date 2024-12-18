import { h } from 'preact';
import styles from './CustomizerDrawer.module.css';
import { useDrawerControls } from '../../components/Drawer.js';
import { useContext, useEffect } from 'preact/hooks';
import { CustomizerContext } from '../CustomizerProvider.js';
import { CustomizerDrawerInner } from './CustomizerDrawerInner.js';

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<boolean>} props.displayChildren
 */
export function CustomizerDrawer({ displayChildren }) {
    const { open, close } = useDrawerControls();
    useEffect(() => {
        const checker = () => {
            const shouldOpen = window.location.hash.startsWith('#/customizer');
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

    return <div class={styles.root}>{displayChildren.value === true && <CustomizerConsumer />}</div>;
}

function CustomizerConsumer() {
    const { data, select, upload, setTheme, deleteImage } = useContext(CustomizerContext);
    return <CustomizerDrawerInner data={data} select={select} onUpload={upload} setTheme={setTheme} deleteImage={deleteImage} />;
}
