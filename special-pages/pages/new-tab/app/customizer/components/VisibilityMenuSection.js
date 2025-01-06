import { useLayoutEffect, useState } from 'preact/hooks';
import { Customizer, getItems } from './Customizer.js';
import { EmbeddedVisibilityMenu } from './VisibilityMenu.js';
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

    return <EmbeddedVisibilityMenu rows={rowData} />;
}
