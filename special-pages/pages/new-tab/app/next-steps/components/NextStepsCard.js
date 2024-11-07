import { h } from 'preact';
import cn from 'classnames';
import styles from './NextSteps.module.css';
import { Cross } from '../../components/Icons.js';
import { variants, otherText } from '../nextsteps.data';
import { useTypedTranslation } from '../../types';

/*
 * @import { NextStepsCards } from "../../../../types/new-tab"
 * @param {object} props
 * @param {NextStepsCards} props.type
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function NextStepsCard({ type, dismiss, action }) {
    const { t } = useTypedTranslation();
    const message = variants[type]?.(t);
    return (
        <div class={styles.nextStepsCard}>
            <img src={`./icons/${message.icon}-128.svg`} alt="" class={styles.icon} />
            <p class={styles.title}>{message.title}</p>
            <p class={styles.description}>{message.summary}</p>
            <button class={styles.btn} onClick={() => action(message.id)}>
                {message.actionText}
            </button>

            <button class={cn(styles.btn, styles.dismissBtn)} onClick={() => dismiss(message.id)} aria-label={otherText.dismiss(t)}>
                <Cross />
            </button>
        </div>
    );
}
