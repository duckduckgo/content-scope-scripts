import { h } from 'preact';
import { Signal, useComputed, useSignal } from '@preact/signals';
import classNames from 'classnames';
import styles from './Search.module.css';
import { SearchInput, toDisplay } from './SearchInput.js';
import { eventToTarget, viewTransition } from '../../utils.js';
import { useEffect, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { usePlatformName } from '../../settings.provider.js';

export function Search() {
    const mode = useSignal(/** @type {"search"  | "ai"} */ ('search'));
    const suggestions = useSignal(/** @type {import('../../../types/new-tab').Suggestions} */ ([]));
    const selected = useSignal(/** @type {null|number} */ (null));
    const ntp = useMessaging();
    const platformName = usePlatformName();
    const showing = useComputed(() => {
        if (suggestions.value.length > 0) return 'showing-suggestions';
        return 'none';
    });

    function setMode(next) {
        viewTransition(() => {
            mode.value = next;
            suggestions.value = [];
            window.dispatchEvent(new Event('reset-back-to-last-typed-value'));
        });
    }

    useEffect(() => {
        const listener = () => {
            suggestions.value = [];
            selected.value = null;
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

    function onSubmit(e) {
        e.preventDefault();

        if (!(e.target instanceof HTMLFormElement)) return;

        const data = new FormData(e.target);
        const term = data.get('term');
        const selected = data.get('selected');
        const mode = data.get('mode');
        const target = eventToTarget(e, platformName);

        if (mode === 'ai' && term) {
            return ntp.messaging.notify('search_submitChat', { chat: String(term), target });
        }

        if (term && selected) {
            const suggestion = suggestions.value[Number(selected)];
            if (suggestion) {
                console.log({ term, selected });
                ntp.messaging.notify('search_openSuggestion', { suggestion, target });
            } else {
                console.warn('not found');
            }
        } else if (term) {
            ntp.messaging.notify('search_submit', { term: String(term), target });
        }

        window.dispatchEvent(new Event('clear-all'));
        window.dispatchEvent(new Event('clear-suggestions'));
    }

    return (
        <div class={styles.root} data-state={showing} data-mode={mode}>
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
            <div class={styles.formWrap}>
                <form onSubmit={onSubmit} class={styles.form}>
                    <SearchInput mode={mode} suggestions={suggestions} selected={selected} />
                    <SelectedInput selected={selected} />
                    <input type="hidden" name="mode" value={mode} />
                    {showing.value === 'showing-suggestions' && <SuggestionList suggestions={suggestions} selected={selected} />}
                </form>
            </div>
        </div>
    );
}

function SelectedInput({ selected }) {
    if (selected.value === null) return null;
    return <input type="hidden" name="selected" value={selected.value} />;
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
            if (!ref.current?.contains(e.target)) {
                window.dispatchEvent(new Event('clear-suggestions'));
            }
        };
        document.addEventListener('click', listener);
        return () => {
            document.removeEventListener('click', listener);
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

    useEffect(() => {
        function mouseEnter(e) {
            const button = e.target.closest('button[value]');
            if (button && button instanceof HTMLButtonElement) {
                selected.value = Number(button.value);
            }
        }
        ref.current?.addEventListener('mouseenter', mouseEnter, true);
        return () => {
            ref.current?.removeEventListener('mouseenter', mouseEnter, true);
        };
    }, [selected]);

    return (
        <div
            class={styles.list}
            data-selected={selected}
            ref={ref}
            onMouseLeave={() => {
                window.dispatchEvent(new Event('reset-back-to-last-typed-value'));
            }}
        >
            {list.value.map((x, index) => {
                const icon = iconFor(x.item);
                return (
                    <button class={styles.item} value={index} key={toDisplay(x.item)} data-selected={x.selected}>
                        {icon} {toDisplay(x.item)}
                    </button>
                );
            })}
        </div>
    );
}

/**
 *
 * @param {import('../../../types/new-tab').Suggestions[number]} suggestion
 */
function iconFor(suggestion) {
    switch (suggestion.kind) {
        case 'phrase':
            return <SearchIcon />;
        case 'website':
            return <GlobeIcon />;
        case 'historyEntry':
            return <HistoryIcon />;
        case 'bookmark':
            if (suggestion.isFavorite) {
                return <FavoriteIcon />;
            }
            return <BookmarkIcon />;
        case 'openTab':
        case 'internalPage':
            console.warn('icon not implemented for ', suggestion.kind);
            return null;
    }
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

export function BookmarkIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M4.5 7a5 5 0 0 1 5-5h5a5 5 0 0 1 5 5v12.102c0 2.31-2.587 3.677-4.495 2.375l-2.23-1.522a1.375 1.375 0 0 0-1.55 0l-2.23 1.522C7.089 22.779 4.5 21.412 4.5 19.102V7Zm5-3.5A3.5 3.5 0 0 0 6 7v12.102a1.375 1.375 0 0 0 2.15 1.136l2.23-1.522a2.875 2.875 0 0 1 3.24 0l2.23 1.522c.913.623 2.15-.031 2.15-1.136V7a3.5 3.5 0 0 0-3.5-3.5h-5Z"
                clip-rule="evenodd"
            />
        </svg>
    );
}

export function FavoriteIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M12.477 7.345a.5.5 0 0 0-.928 0l-.728 1.812a.5.5 0 0 1-.43.313l-1.948.132a.5.5 0 0 0-.287.883l1.499 1.252a.5.5 0 0 1 .164.505l-.477 1.894a.5.5 0 0 0 .751.546l1.654-1.039a.5.5 0 0 1 .532 0l1.654 1.039a.5.5 0 0 0 .75-.546l-.476-1.893a.5.5 0 0 1 .165-.506l1.498-1.252a.5.5 0 0 0-.286-.883l-1.949-.132a.5.5 0 0 1-.43-.313l-.728-1.812Z"
            />
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M9.5 2a5 5 0 0 0-5 5v12.102c0 2.31 2.588 3.677 4.496 2.375l2.23-1.522a1.375 1.375 0 0 1 1.55 0l2.229 1.522c1.908 1.302 4.495-.065 4.495-2.375V7a5 5 0 0 0-5-5h-5ZM6 7a3.5 3.5 0 0 1 3.5-3.5h5A3.5 3.5 0 0 1 18 7v12.102c0 1.105-1.237 1.759-2.15 1.136l-2.23-1.522a2.875 2.875 0 0 0-3.24 0l-2.23 1.522A1.375 1.375 0 0 1 6 19.102V7Z"
                clip-rule="evenodd"
            />
        </svg>
    );
}

export function GlobeIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                fill-rule="evenodd"
                d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm1.529-.7a8.507 8.507 0 0 1 5.616-7.308 8.524 8.524 0 0 0-.57 1.194c-.682 1.748-1.058 4.093-1.074 6.64a49.2 49.2 0 0 1-3.753-.49l-.22-.037Zm.01 1.523a8.508 8.508 0 0 0 5.606 7.186 8.53 8.53 0 0 1-.57-1.195c-.577-1.479-.935-3.384-1.041-5.478a50.81 50.81 0 0 1-3.994-.513Zm5.503.624c.112 1.899.442 3.57.93 4.82.306.782.657 1.36 1.02 1.732.356.363.691.501 1.008.501.317 0 .653-.138 1.008-.501.363-.372.715-.95 1.02-1.731.489-1.252.819-2.923.93-4.821-1.97.115-3.946.115-5.916 0Zm7.425-.111c-.107 2.094-.464 4-1.042 5.478-.167.428-.356.83-.57 1.195a8.508 8.508 0 0 0 5.606-7.186 50.802 50.802 0 0 1-3.994.513Zm4.005-2.037-.219.037a49.196 49.196 0 0 1-3.753.49c-.017-2.547-.392-4.892-1.075-6.64a8.526 8.526 0 0 0-.57-1.194 8.507 8.507 0 0 1 5.617 7.307ZM15 11.941a49.224 49.224 0 0 1-6 0c.006-2.47.368-4.66.972-6.209.306-.782.657-1.36 1.02-1.73.356-.364.691-.502 1.008-.502.317 0 .653.138 1.008.501.363.372.715.95 1.02 1.731.605 1.549.967 3.74.972 6.21Z"
                clip-rule="evenodd"
            />
        </svg>
    );
}

export function HistoryIcon() {
    return (
        <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M4.562 8c-.021 0-.042 0-.063-.002A8.5 8.5 0 1 1 3.5 12 .75.75 0 0 0 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2a9.993 9.993 0 0 0-8.5 4.73V3.75a.75.75 0 1 0-1.5 0v3.189A2.561 2.561 0 0 0 4.562 9.5H7.25a.75.75 0 1 0 0-1.5H4.562Z"
            />
            <path
                fill="currentColor"
                d="M12.781 6.531a.781.781 0 0 0-1.562 0V12c0 .207.082.406.229.552l2.969 2.97a.781.781 0 1 0 1.104-1.106l-2.74-2.74V6.531Z"
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
