import styles from './Favorites.module.css';
import { Placeholder, PlusIconMemo, Tile } from './Tile.js';
import { h } from 'preact';
import { memo } from 'preact/compat';
import { ROW_CAPACITY } from './Favorites.js';

/**
 * Represents a row of tiles with optional placeholders to fill empty spaces in the first  row.
 * @param {object} props - An object containing parameters for the TileRow_ function.
 * @param {number} props.topOffset - The top offset position of the row.
 * @param {Array} props.items - An array of items to be displayed as tiles in the row.
 * @param {()=>void} props.add - A function to be called when a new item is added to the row.
 * @param {string} [props.dropped] - The ID of the item that has been dropped (if one exists)
 */
function TileRow_({ topOffset, items, add, dropped }) {
    const fillers = ROW_CAPACITY - items.length;
    return (
        <ul className={styles.gridRow} style={{ top: topOffset + 'px' }}>
            {items.map((item, index) => {
                return (
                    <Tile
                        url={item.url}
                        faviconSrc={item.favicon?.src}
                        faviconMax={item.favicon?.maxAvailableSize}
                        title={item.title}
                        key={item.id + item.favicon?.src + item.favicon?.maxAvailableSize}
                        id={item.id}
                        index={index}
                        dropped={dropped === item.id}
                    />
                );
            })}
            {Array.from({ length: fillers }).map((_, index) => {
                if (index === 0) {
                    return <PlusIconMemo key="placeholder-plus" onClick={add} />;
                }
                return <Placeholder key={`placeholder-${index}`} />;
            })}
        </ul>
    );
}

export const TileRow = memo(TileRow_);
