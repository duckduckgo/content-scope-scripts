import styles from './Favorites.module.css';
import { Placeholder, PlusIconMemo, Tile } from './Tile.js';
import { h } from 'preact';
import { memo } from 'preact/compat';
import { ROW_CAPACITY } from './Favorites.js';

function TileRow_({ top_offset, items, add }) {
    const fillers = ROW_CAPACITY - items.length;
    return (
        <ul className={styles.gridRow} style={{ top: top_offset + 'px' }}>
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
