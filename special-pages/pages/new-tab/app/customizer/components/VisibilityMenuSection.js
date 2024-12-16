import { useLayoutEffect, useState } from 'preact/hooks';
import { Customizer, getItems } from './Customizer.js';
import styles from './CustomizerDrawerInner.module.css';
import { VisibilityMenu } from './VisibilityMenu.js';
import { h } from 'preact';

export function VisibilityMenuSection() {
    const [rowData, setRowData] = useState(() => {
        const items = /** @type {import("./Customizer.js").VisibilityRowData[]} */ (getItems());
        return items;
    });
    useLayoutEffect(() => {
        function handler() {
            setRowData(getItems());
        }
        window.addEventListener(Customizer.UPDATE_EVENT, handler);
        return () => {
            window.removeEventListener(Customizer.UPDATE_EVENT, handler);
        };
    }, []);
    return (
        <div class={styles.section}>
            <h3 class={styles.sectionTitle}>Sections</h3>
            <div class={styles.sectionBody}>
                <VisibilityMenu rows={rowData} variant={'embedded'} />
            </div>
        </div>
    );
}
