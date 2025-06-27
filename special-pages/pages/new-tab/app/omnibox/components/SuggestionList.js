import { h } from 'preact';
import styles from './SuggestionList.module.css';

export function SuggestionList({}) {
    const items = new Array(20).fill(1);
    return (
        <div
            class={styles.list}
            // data-selected={selected}
            // ref={ref}
            // onMouseLeave={() => {
            //     window.dispatchEvent(new Event('reset-back-to-last-typed-value'));
            // }}
        >
            {items.map((x, index) => {
                // const icon = iconFor(x.item);
                return (
                    <button
                        class={styles.item}
                        value={index}
                        key={index}
                        // data-selected={x.selected}
                    >
                        {/* {icon} {toDisplay(x.item)} */}
                        Item
                    </button>
                );
            })}
        </div>
    );
}
