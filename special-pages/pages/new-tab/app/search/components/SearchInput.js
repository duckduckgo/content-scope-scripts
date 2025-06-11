import cn from 'classnames';
import { h } from 'preact';
import styles from './SearchInput.module.css';
import { DuckAiIcon, SearchIcon } from './Search.js';
import { useEffect, useRef } from 'preact/hooks';

/**
 * Renders a search input component with optional mode-based controls and tab switching functionality.
 *
 * @param {Object} props - The props for the SearchInput component.
 * @param {import('@preact/signals').Signal<'ai' | 'search'>} props.mode - The mode in which the component operates. Determines the presence of additional controls.
 */
export function SearchInput({ mode }) {
    const inputRef = useRef(/** @type {HTMLInputElement|null} */ (null));

    useEffect(() => {
        return mode.subscribe(() => {
            inputRef.current?.focus();
        });
    }, [mode]);

    return (
        <div class={styles.root} style={{ viewTransitionName: 'search-input-transition' }}>
            <div class={styles.searchContainer} style={{ viewTransitionName: 'search-input-transition2' }}>
                <input
                    ref={inputRef}
                    type="text"
                    class={styles.searchInput}
                    placeholder="Search or enter address"
                    aria-label="Search or enter address"
                    spellcheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-testid="searchInput"
                />
                {mode.value === 'search' && (
                    <div class={styles.searchActions}>
                        <button class={cn(styles.searchTypeButton)} aria-label="Web search">
                            <SearchIcon />
                        </button>
                        <div class={styles.separator}></div>
                        <button class={cn(styles.searchTypeButton)} aria-label="Image search">
                            <DuckAiIcon />
                        </button>
                    </div>
                )}
                {mode.value === 'ai' && (
                    <div class={styles.searchActions}>
                        <button class={cn(styles.searchTypeButton, styles.squareButton, styles.submit)} aria-label="Web search">
                            <Arrow />
                        </button>
                    </div>
                )}
            </div>
            {mode.value === 'ai' && (
                <div class={styles.secondaryControls}>
                    <button class={cn(styles.squareButton, styles.buttonSecondary)} aria-label="Secondary action 1">
                        <Plus />
                    </button>
                    <button class={cn(styles.squareButton, styles.buttonSecondary)} aria-label="Secondary action 2">
                        <Opts />
                    </button>
                </div>
            )}
        </div>
    );
}

function Arrow() {
    return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8.68731 2.5915C8.44333 2.34733 8.44347 1.9516 8.68764 1.70761C8.93181 1.46363 9.32754 1.46377 9.57153 1.70794L14.8828 7.02322C15.712 7.85296 15.712 9.19756 14.8828 10.0273L9.5717 15.3425C9.32772 15.5866 8.93199 15.5868 8.68782 15.3428C8.44365 15.0988 8.4435 14.7031 8.68748 14.4589L13.9921 9.15028H1.125C0.779822 9.15028 0.5 8.87046 0.5 8.52528C0.5 8.1801 0.779822 7.90028 1.125 7.90028H13.9921L8.68731 2.5915Z"
                fill="currentColor"
            />
        </svg>
    );
}

function Plus() {
    return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8.25 15.0275V9.15247H2.375C2.02982 9.15247 1.75 8.87264 1.75 8.52747C1.75 8.18229 2.02982 7.90247 2.375 7.90247H8.25V2.02747C8.25 1.68229 8.52982 1.40247 8.875 1.40247C9.22018 1.40247 9.5 1.68229 9.5 2.02747V7.90247H15.375C15.7202 7.90247 16 8.18229 16 8.52747C16 8.87264 15.7202 9.15247 15.375 9.15247H9.5V15.0275C9.5 15.3726 9.22018 15.6525 8.875 15.6525C8.52982 15.6525 8.25 15.3726 8.25 15.0275Z"
                fill="black"
                fill-opacity="0.84"
            />
        </svg>
    );
}

function Opts() {
    return (
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12 8.90247C13.933 8.90247 15.5 10.4695 15.5 12.4025C15.5 14.3355 13.933 15.9025 12 15.9025C10.2368 15.9025 8.77879 14.5986 8.53613 12.9025H2.125C1.77982 12.9025 1.5 12.6226 1.5 12.2775C1.5 11.9323 1.77982 11.6525 2.125 11.6525H8.58203C8.92548 10.08 10.3246 8.90247 12 8.90247ZM12 10.1525C10.7574 10.1525 9.75 11.1598 9.75 12.4025C9.75 13.6451 10.7574 14.6525 12 14.6525C13.2426 14.6525 14.25 13.6451 14.25 12.4025C14.25 11.1598 13.2426 10.1525 12 10.1525Z"
                fill="black"
                fill-opacity="0.84"
            />
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5 1.90247C6.7632 1.90247 8.22121 3.20637 8.46387 4.90247H14.875C15.2202 4.90247 15.5 5.18229 15.5 5.52747C15.5 5.87264 15.2202 6.15247 14.875 6.15247H8.41797C8.07452 7.7249 6.67545 8.90247 5 8.90247C3.067 8.90247 1.5 7.33546 1.5 5.40247C1.5 3.46947 3.067 1.90247 5 1.90247ZM5 3.15247C3.75736 3.15247 2.75 4.15983 2.75 5.40247C2.75 6.64511 3.75736 7.65247 5 7.65247C6.24264 7.65247 7.25 6.64511 7.25 5.40247C7.25 4.15983 6.24264 3.15247 5 3.15247Z"
                fill="black"
                fill-opacity="0.84"
            />
        </svg>
    );
}
