import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import cn from 'classnames';
import { EmojiBurst } from './EmojiBurst.js';
import styles from './SetupChecklist.module.css';

/**
 * Hardcoded demo data: the user left onboarding on the taskbar step after setting the default browser.
 *
 * `system` items hand off to a browser or OS prompt (faked here with a short pause); `toggle` items are plain settings.
 * `step` is the onboarding step that covers the item, used when resuming the guided setup.
 *
 * @typedef {{ id: string, kind: 'system'|'toggle', step: string, toast: string, title: string, hint: string, icon: string, action: string, next: string }} ChecklistItem
 * @type {ChecklistItem[]}
 */
const ITEMS = [
    {
        id: 'defaultBrowser',
        kind: 'system',
        step: 'makeDefaultSingle',
        toast: 'DuckDuckGo is now your default browser',
        title: 'Make DuckDuckGo your default browser',
        hint: 'Open links privately, everywhere',
        icon: './setup-checklist/default-browser.svg',
        action: 'Set Default',
        next: 'Make DuckDuckGo your default',
    },
    {
        id: 'taskbar',
        kind: 'system',
        step: 'systemSettings',
        toast: 'Pinned to your taskbar',
        title: 'Pin DuckDuckGo to your taskbar',
        hint: 'Open it in one click',
        icon: './setup-checklist/dock.svg',
        action: 'Pin',
        next: 'Pin DuckDuckGo to your taskbar',
    },
    {
        id: 'import',
        kind: 'system',
        step: 'systemSettings',
        toast: 'Passwords & bookmarks imported',
        title: 'Import passwords & bookmarks',
        hint: 'From Chrome, Edge or a file',
        icon: './setup-checklist/import.svg',
        action: 'Import',
        next: 'Bring over your passwords & bookmarks',
    },
    {
        id: 'bookmarksBar',
        kind: 'toggle',
        step: 'customize',
        toast: 'Bookmarks bar is on',
        title: 'Show the bookmarks bar',
        hint: 'Your favorite sites, one click away',
        icon: './setup-checklist/bookmark.svg',
        action: 'Show',
        next: 'Show the bookmarks bar',
    },
    {
        id: 'sessionRestore',
        kind: 'toggle',
        step: 'customize',
        toast: 'Your tabs will reopen on startup',
        title: 'Reopen your tabs on startup',
        hint: 'Pick up right where you left off',
        icon: './setup-checklist/session-restore.svg',
        action: 'Turn On',
        next: 'Reopen your tabs on startup',
    },
    {
        id: 'homeButton',
        kind: 'toggle',
        step: 'customize',
        toast: 'Home button added',
        title: 'Add a home button',
        hint: 'Jump back to your New Tab page',
        icon: './setup-checklist/home.svg',
        action: 'Add',
        next: 'Add a home button',
    },
];

const INITIALLY_DONE = ['defaultBrowser'];

/** Demo only: progress shared with onboarding's mock through localStorage (same origin in the integration build) */
const DEMO_KEY = 'ddg-setup-demo-done';
/** What this page last showed, so steps finished elsewhere animate in when the user comes back */
const SEEN_KEY = 'ddg-setup-demo-seen';

/**
 * @param {Storage} storage
 * @param {string} key
 * @returns {string[] | null}
 */
function readList(storage, key) {
    try {
        const raw = storage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * @param {Storage} storage
 * @param {string} key
 * @param {string[]} value
 */
function writeList(storage, key, value) {
    try {
        storage.setItem(key, JSON.stringify(value));
    } catch {
        // storage can be unavailable; the demo still works for this page view
    }
}

/** Fake hand-off time for browser/OS prompts like pinning or importing */
const SYSTEM_PROMPT_MS = 1100;
const TOAST_MS = 3200;

/** How long the "all set" moment stays on screen before the card tucks itself away */
const CELEBRATION_MS = 2200;

/**
 * Collapsible "Finish setting up" card that picks up where onboarding was left.
 */
export function SetupChecklist() {
    const [stored] = useState(() => readList(localStorage, DEMO_KEY) ?? INITIALLY_DONE);
    // Start from what was shown last time, then catch up so newly finished steps visibly tick off
    const [done, setDone] = useState(() => {
        const seen = readList(sessionStorage, SEEN_KEY);
        return seen ? stored.filter((id) => seen.includes(id)) : stored;
    });
    const [expanded, setExpanded] = useState(false);
    const [pending, setPending] = useState(/** @type {string|null} */ (null));
    const [toast, setToast] = useState(/** @type {{ text: string, undoId?: string, key: number } | null} */ (null));

    useEffect(() => {
        if (done.length === stored.length) return;
        const catchUp = setTimeout(() => setDone(stored), 900);
        return () => clearTimeout(catchUp);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
    }, []);

    useEffect(() => {
        writeList(localStorage, DEMO_KEY, done);
        writeList(sessionStorage, SEEN_KEY, done);
    }, [done]);

    useEffect(() => {
        if (!toast) return;
        const hide = setTimeout(() => setToast(null), TOAST_MS);
        return () => clearTimeout(hide);
    }, [toast]);
    const [stage, setStage] = useState(/** @type {'active'|'celebrating'|'leaving'|'gone'} */ ('active'));

    const total = ITEMS.length;
    const doneCount = done.length;
    const remaining = total - doneCount;
    const nextItem = ITEMS.find((item) => !done.includes(item.id));

    useEffect(() => {
        if (remaining > 0 || stage !== 'active') return;
        // The celebration replaces the last confirmation (an Undo there would be confusing)
        setToast(null);
        setStage('celebrating');
        const leave = setTimeout(() => setStage('leaving'), CELEBRATION_MS);
        const gone = setTimeout(() => {
            setStage('gone');
            // Next demo take starts fresh
            localStorage.removeItem(DEMO_KEY);
            sessionStorage.removeItem(SEEN_KEY);
        }, CELEBRATION_MS + 600);
        return () => {
            clearTimeout(leave);
            clearTimeout(gone);
        };
    }, [remaining, stage]);

    if (stage === 'gone') return null;

    const markDone = (/** @type {string} */ id) => setDone((prev) => (prev.includes(id) ? prev : [...prev, id]));
    const undo = (/** @type {string} */ id) => {
        setDone((prev) => prev.filter((x) => x !== id));
        setToast(null);
    };

    /** @param {ChecklistItem} item */
    const complete = (item) => {
        if (pending) return;
        if (item.kind === 'toggle') {
            markDone(item.id);
            setToast({ text: item.toast, undoId: item.id, key: Date.now() });
            return;
        }
        setPending(item.id);
        setTimeout(() => {
            setPending(null);
            markDone(item.id);
            setToast({ text: item.toast, key: Date.now() });
        }, SYSTEM_PROMPT_MS);
    };

    // Reopens the guided setup on the first step that still has something to do
    const resumeSetup = () => {
        if (!nextItem) return;
        const params = new URLSearchParams(window.location.search);
        const target = new URL('../onboarding/', window.location.href);
        target.searchParams.set('platform', params.get('platform') || 'windows');
        target.searchParams.set('page', nextItem.step);
        target.searchParams.set('resume', '');
        // Windows hides these onboarding steps by default
        target.searchParams.append('exclude', 'duckPlayerSingle');
        target.searchParams.append('exclude', 'addressBarMode');
        document.body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in', fill: 'forwards' });
        setTimeout(() => window.location.assign(target.href), 400);
    };

    const toggle = () => setExpanded((prev) => !prev);
    const celebrating = stage !== 'active';

    return (
        <section
            class={cn(styles.outer, { [styles.leaving]: stage === 'leaving' })}
            aria-label="Finish setting up"
            data-testid="SetupChecklist"
        >
            <div class={styles.outerInner}>
                <div class={cn(styles.card, { [styles.expanded]: expanded && !celebrating, [styles.celebrating]: celebrating })}>
                    <div class={styles.header} onClick={celebrating ? undefined : toggle}>
                        <ProgressRing value={doneCount} total={total} complete={celebrating} />
                        <div class={styles.headings}>
                            <h2 class={styles.title}>
                                <Swap show={celebrating ? 'b' : 'a'} a="Finish setting up" b="You’re all set!" />
                            </h2>
                            <p class={styles.subtitle}>
                                <Swap
                                    show={celebrating ? 'c' : expanded ? 'b' : 'a'}
                                    a={nextItem ? `Next: ${nextItem.next}` : ''}
                                    b={`${remaining} quick ${remaining === 1 ? 'step' : 'steps'} left`}
                                    c="Enjoy browsing privately."
                                />
                            </p>
                        </div>
                        <div class={cn(styles.control, { [styles.controlHidden]: celebrating })}>
                            <button
                                type="button"
                                class={styles.continueBtn}
                                tabIndex={celebrating ? -1 : 0}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    resumeSetup();
                                }}
                            >
                                Continue
                            </button>
                            <button
                                type="button"
                                class={styles.chevronBtn}
                                tabIndex={celebrating ? -1 : 0}
                                aria-label={expanded ? 'Collapse checklist' : 'Expand checklist'}
                                aria-expanded={expanded}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggle();
                                }}
                            >
                                <ChevronIcon />
                            </button>
                        </div>
                    </div>

                    <div class={styles.listWrap} aria-hidden={!expanded}>
                        <div class={styles.listInner}>
                            <ul class={styles.list}>
                                {ITEMS.map((item, index) => {
                                    const isDone = done.includes(item.id);
                                    const isNext = nextItem?.id === item.id;
                                    const isPending = pending === item.id;
                                    return (
                                        <li
                                            key={item.id}
                                            class={cn(styles.row, {
                                                [styles.rowDone]: isDone,
                                                [styles.rowNext]: isNext,
                                                [styles.rowPending]: isPending,
                                            })}
                                            style={{ '--i': index }}
                                        >
                                            <StatusDot done={isDone} />
                                            <img class={styles.rowIcon} src={item.icon} alt="" width={24} height={24} />
                                            <span class={styles.rowText}>
                                                <span class={styles.rowTitle}>{item.title}</span>
                                                <span class={styles.rowHint}>{item.hint}</span>
                                            </span>
                                            <button
                                                type="button"
                                                class={cn(styles.actionBtn, { [styles.actionPrimary]: isNext })}
                                                tabIndex={expanded && !isDone ? 0 : -1}
                                                disabled={!!pending}
                                                onClick={() => complete(item)}
                                            >
                                                <span class={styles.actionLabel}>{item.action}</span>
                                                <span class={styles.spinner} aria-hidden="true" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {(stage === 'celebrating' || stage === 'leaving') && <EmojiBurst />}
            {toast && (
                <div key={toast.key} class={styles.toast} role="status">
                    <CheckSmallIcon />
                    <span>{toast.text}</span>
                    {toast.undoId && (
                        <button type="button" class={styles.toastUndo} onClick={() => toast.undoId && undo(toast.undoId)}>
                            Undo
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}

function CheckSmallIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="#14735d" />
            <path d="M4.75 8.25l2 2 4.5-4.75" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

/**
 * Cross-fades between stacked labels so the header never jumps in height.
 *
 * @param {object} props
 * @param {string} props.show
 * @param {string} props.a
 * @param {string} props.b
 * @param {string} [props.c]
 */
function Swap({ show, a, b, c }) {
    const labels = /** @type {[string, string][]} */ ([['a', a], ['b', b], ...(c !== undefined ? [['c', c]] : [])]);
    return (
        <span class={styles.swap}>
            {labels.map(([key, text]) => (
                <span key={key} class={cn(styles.swapItem, { [styles.swapActive]: show === key })} aria-hidden={show !== key}>
                    {text}
                </span>
            ))}
        </span>
    );
}

/**
 * @param {object} props
 * @param {number} props.value
 * @param {number} props.total
 * @param {boolean} props.complete
 */
export function ProgressRing({ value, total, complete }) {
    const size = 44;
    const stroke = 4;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - value / total);

    return (
        <div class={cn(styles.ring, { [styles.ringComplete]: complete })} role="img" aria-label={`${value} of ${total} steps done`}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
                <circle class={styles.ringTrack} cx={size / 2} cy={size / 2} r={radius} stroke-width={stroke} fill="none" />
                <circle
                    class={styles.ringArc}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke-width={stroke}
                    fill="none"
                    stroke-linecap="round"
                    stroke-dasharray={circumference}
                    stroke-dashoffset={offset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </svg>
            <span class={styles.ringLabel}>
                <span class={styles.ringCount}>
                    {value}/{total}
                </span>
                <svg class={styles.ringCheck} width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                        d="M4.5 9.5l3 3 6-7"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </span>
            <span class={styles.burst} aria-hidden="true">
                {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} style={{ '--a': `${i * 45}deg` }} />
                ))}
            </span>
        </div>
    );
}

/**
 * @param {object} props
 * @param {boolean} props.done
 */
function StatusDot({ done }) {
    return (
        <span class={styles.dot} aria-label={done ? 'Done' : 'Not done yet'}>
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path
                    class={styles.dotCheck}
                    d="M2.75 6.25l2.25 2.25 4.25-4.75"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </span>
    );
}

function ChevronIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 10l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}
