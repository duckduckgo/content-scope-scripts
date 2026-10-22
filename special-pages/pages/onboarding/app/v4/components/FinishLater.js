import { h } from 'preact';
import { useState } from 'preact/hooks';
import cn from 'classnames';
import { useTypedTranslation } from '../../types';
import { useGlobalDispatch, useGlobalState } from '../../global';
import styles from './FinishLater.module.css';

/**
 * Quiet exit shown under each setup step. Leaves onboarding without losing progress,
 * so the user can resume from the New Tab Page later.
 */
export function FinishLater() {
    const { t } = useTypedTranslation();
    const dispatch = useGlobalDispatch();
    const { exiting } = useGlobalState();
    const [leaving, setLeaving] = useState(false);

    const onClick = () => {
        setLeaving(true);
        dispatch({ kind: 'finish-later' });
    };

    return (
        <div class={cn(styles.root, { [styles.hidden]: exiting || leaving })}>
            <button type="button" class={styles.button} onClick={onClick} aria-describedby="finish-later-tooltip">
                <BookmarkIcon />
                <span>{t('finishLater')}</span>
            </button>
            <span id="finish-later-tooltip" role="tooltip" class={styles.tooltip}>
                {t('finishLaterTooltip')}
            </span>
        </div>
    );
}

function BookmarkIcon() {
    return (
        <svg class={styles.icon} width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
                class={styles.ribbon}
                d="M3.5 2.25c0-.414.336-.75.75-.75h5.5c.414 0 .75.336.75.75v9.69a.4.4 0 0 1-.64.32L7 10.25l-2.86 2.01a.4.4 0 0 1-.64-.32V2.25Z"
                stroke="currentColor"
                stroke-width="1.25"
                stroke-linejoin="round"
            />
        </svg>
    );
}
