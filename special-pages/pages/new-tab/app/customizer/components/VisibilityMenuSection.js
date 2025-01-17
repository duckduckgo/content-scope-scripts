import { useLayoutEffect, useState } from 'preact/hooks';
import { CustomizerMenu, getItems } from './CustomizerMenu.js';
import { EmbeddedVisibilityMenu } from './VisibilityMenu.js';
import { h } from 'preact';

export function VisibilityMenuSection() {
    const [rowData, setRowData] = useState(() => {
        const items = /** @type {import("./CustomizerMenu.js").VisibilityRowData[]} */ (getItems());
        return items;
    });
    useLayoutEffect(() => {
        function handler() {
            setRowData(getItems());
        }

        window.addEventListener(CustomizerMenu.UPDATE_EVENT, handler);
        return () => {
            window.removeEventListener(CustomizerMenu.UPDATE_EVENT, handler);
        };
    }, []);

    return <EmbeddedVisibilityMenu rows={rowData} />;
}
