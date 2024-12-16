import { h } from 'preact';
import styles from './CustomizerDrawerInner.module.css';
import { useState, useEffect } from 'preact/hooks';
import { Customizer, getItems } from './Customizer';
import { VisibilityMenu } from './VisibilityMenu.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 */
export function CustomizerDrawerInner({ data }) {
    console.log('incoming', data.value);
    const [rowData, setRowData] = useState(() => {
        const items = /** @type {import("./Customizer.js").VisibilityRowData[]} */ (getItems());
        return items;
    });

    useEffect(() => {
        function handler() {
            setRowData(getItems());
        }
        window.addEventListener(Customizer.UPDATE_EVENT, handler);
        return () => {
            window.removeEventListener(Customizer.UPDATE_EVENT, handler);
        };
    }, []);

    return (
        <div class={styles.root}>
            <h2>Customize</h2>
            <br />
            <VisibilityMenu rows={rowData} variant={'embedded'} />
        </div>
    );
}
