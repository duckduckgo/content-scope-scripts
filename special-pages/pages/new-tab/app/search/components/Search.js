import { h } from 'preact';
import { Signal, useComputed, useSignal } from '@preact/signals';
import classNames from 'classnames';
import styles from './Search.module.css';
import { SearchInput, toDisplay } from './SearchInput.js';
import { viewTransition } from '../../utils.js';
import { useEffect, useRef } from 'preact/hooks';

export function Search() {
    const mode = useSignal(/** @type {"search"  | "ai"} */ ('search'));
    const suggestions = useSignal(/** @type {import('../../../types/new-tab').Suggestions} */ ([]));
    const selected = useSignal(/** @type {null|number} */ (null));
    const showing = useComputed(() => {
        if (suggestions.value.length > 0) return 'showing-suggestions';
        return 'none';
    });

    function setMode(next) {
        viewTransition(() => {
            mode.value = next;
            suggestions.value = [];
            window.dispatchEvent(new Event('reset-mode'));
        });
    }

    useEffect(() => {
        const listener = () => {
            suggestions.value = [];
        };
        window.addEventListener('clear-suggestions', listener);
        return () => {
            window.removeEventListener('clear-suggestions', listener);
        };
    }, []);
    useEffect(() => {
        const listener = (e) => {
            if (e.key === 'Escape') {
                window.dispatchEvent(new Event('clear-suggestions'));
            }
        };
        window.addEventListener('keydown', listener);
        return () => {
            window.removeEventListener('keydown', listener);
        };
    }, []);

    return (
        <div class={styles.root} data-state={showing}>
            <div class={styles.icons}>
                <img class={styles.iconSearch} src="./icons/search/Logo.svg" alt="Search" />
                <img class={styles.iconText} src="./icons/search/Logotype.svg" alt="Search" />
            </div>
            <div class={styles.wrap}>
                <div class={styles.pillSwitcher}>
                    <button
                        class={classNames(styles.pillOption, { [styles.active]: mode.value === 'search' })}
                        onClick={() => setMode('search')}
                    >
                        <SearchIcon />
                        Search
                    </button>
                    <button class={classNames(styles.pillOption, { [styles.active]: mode.value === 'ai' })} onClick={() => setMode('ai')}>
                        <DuckAiIcon />
                        Duck.ai
                    </button>
                </div>
            </div>
            <SearchInput mode={mode} suggestions={suggestions} selected={selected} />
            {showing.value === 'showing-suggestions' && <SuggestionList suggestions={suggestions} selected={selected} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {import("@preact/signals").Signal<import('../../../types/new-tab').Suggestions>} props.suggestions
 * @param {Signal<number|null>} props.selected
 */
function SuggestionList({ suggestions, selected }) {
    const ref = useRef(/** @type {HTMLDivElement|null} */ (null));
    const list = useComputed(() => {
        const index = selected.value;
        return suggestions.value.map((x, i) => {
            return { item: x, selected: i === index };
        });
    });
    useEffect(() => {
        const listener = () => {
            if (!ref.current?.contains(document.activeElement)) {
                window.dispatchEvent(new Event('clear-suggestions'));
            }
        };
        window.addEventListener('focusin', listener);
        return () => {
            window.removeEventListener('focusin', listener);
        };
    }, []);
    useEffect(() => {
        const listener = (e) => {
            if (e.key === 'ArrowDown') {
                if (selected.value === null) {
                    selected.value = 0;
                } else {
                    const next = Math.min(selected.value + 1, list.value.length - 1);
                    selected.value = next;
                }
            }
            if (e.key === 'ArrowUp') {
                if (selected.value === null) return;
                if (selected.value === 0) {
                    selected.value = null;
                    window.dispatchEvent(new Event('focus-input'));
                } else {
                    const next = Math.max(selected.value - 1, 0);
                    selected.value = next;
                }
            }
        };
        window.addEventListener('keydown', listener);
        return () => {
            window.removeEventListener('keydown', listener);
        };
    }, [selected]);

    return (
        <div class={styles.list} data-selected={selected} ref={ref}>
            {list.value.map((x) => {
                return (
                    <a href="#" key={toDisplay(x.item)} data-selected={x.selected} class={styles.item}>
                        {x.item.kind}: {toDisplay(x.item)}
                    </a>
                );
            })}
        </div>
    );
}

export function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" data-name="search">
            <path
                d="M14.8 13.7L10.9 9.8C11.6 8.9 12 7.7 12 6.5C12 3.5 9.5 1 6.5 1C3.5 1 1 3.5 1 6.5C1 9.5 3.5 12 6.5 12C7.7 12 8.9 11.6 9.8 10.9L13.7 14.8C13.8 14.9 14 15 14.2 15C14.4 15 14.6 14.9 14.7 14.8C15.1 14.5 15.1 14 14.8 13.7ZM2.5 6.5C2.5 4.3 4.3 2.5 6.5 2.5C8.7 2.5 10.5 4.3 10.5 6.5C10.5 8.7 8.7 10.5 6.5 10.5C4.3 10.5 2.5 8.7 2.5 6.5Z"
                fill="currentColor"
                fill-opacity="0.6"
            />
        </svg>
    );
}

export function DuckAiIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg" data-name="duckai">
            <g clip-path="url(#clip0_699_1452)">
                <path
                    d="M6.785 3.35585C6.71077 3.05892 6.28879 3.05892 6.21455 3.35585L6.05005 4.01385C5.8306 4.89165 5.14522 5.57704 4.26742 5.79649L3.60941 5.96099C3.31249 6.03522 3.31249 6.4572 3.60941 6.53143L4.26742 6.69593C5.14522 6.91538 5.8306 7.60077 6.05005 8.47857L6.21455 9.13657C6.28879 9.4335 6.71077 9.4335 6.785 9.13657L6.9495 8.47857C7.16895 7.60077 7.85434 6.91538 8.73213 6.69593L9.39014 6.53143C9.68707 6.4572 9.68707 6.03522 9.39014 5.96099L8.73214 5.79649C7.85434 5.57704 7.16895 4.89165 6.9495 4.01385L6.785 3.35585Z"
                    fill="currentColor"
                />
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M1.86086 12.852C3.85253 12.5099 7.34272 11.8485 8.76112 11.1975C10.9541 10.4023 12.5 8.48505 12.5 6.24621C12.5 3.29494 9.81371 0.902466 6.5 0.902466C3.18629 0.902466 0.5 3.29494 0.5 6.24621C0.5 7.72686 1.17614 9.06686 2.26844 10.0347C2.50782 10.2467 2.55299 10.6146 2.34345 10.8562L1.37318 11.975C1.04197 12.3569 1.36263 12.9375 1.86086 12.852ZM8.34399 10.2887L8.38147 10.2715L8.42023 10.2574C10.2876 9.58029 11.5 7.99431 11.5 6.24621C11.5 3.95298 9.37347 1.90247 6.5 1.90247C3.62653 1.90247 1.5 3.95298 1.5 6.24621C1.5 7.40938 2.02893 8.4864 2.9316 9.28618C3.53121 9.81745 3.70987 10.807 3.09892 11.5114L2.99283 11.6338C3.72678 11.4971 4.53175 11.3376 5.30842 11.1645C6.61417 10.8735 7.7435 10.5643 8.34399 10.2887Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_699_1452">
                    <rect width="12" height="12" fill="white" transform="translate(0.5 0.902466)" />
                </clipPath>
            </defs>
        </svg>
    );
}
