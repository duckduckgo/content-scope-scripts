import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { NewsCustomized } from '../news/components/NewsCustomized.js';

export function factory() {
    return (
        <Centered data-entry-point="news">
            <NewsCustomized />
        </Centered>
    );
}
