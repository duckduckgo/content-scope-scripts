import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { StockCustomized } from '../stock/components/StockCustomized.js';

export function factory() {
    return (
        <Centered data-entry-point="stock">
            <StockCustomized />
        </Centered>
    );
}
