import { h } from 'preact';
import styles from './CustomizerDrawerInner.module.css';
import { useState, useEffect } from 'preact/hooks';
import { Customizer, getItems } from './Customizer';
import { VisibilityMenu } from './VisibilityMenu.js';
import { useDrawerControls } from '../../components/Drawer.js';

/**
 * @import { Widgets, WidgetConfigItem, WidgetVisibility, VisibilityMenuItem, CustomizerData } from '../../../types/new-tab.js'
 */

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<CustomizerData>} props.data
 */
export function CustomizerDrawerInner({ data }) {
    const { close } = useDrawerControls();
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
            <header>
                <h2>Customize</h2>
                <button onClick={close}>Close</button>
            </header>
            <br />
            <VisibilityMenu rows={rowData} variant={'embedded'} />
        </div>
    );
}
