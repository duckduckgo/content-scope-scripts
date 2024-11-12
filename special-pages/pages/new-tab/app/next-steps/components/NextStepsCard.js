import { h } from 'preact';
import styles from './NextSteps.module.css';
import { DismissButton } from '../../components/DismissButton';
import { variants } from '../nextsteps.data';
import { useTypedTranslation } from '../../types';

/**
//  * @typedef {import('../../../../../types/new-tab').NextStepsCards} NextStepsCards
 * @param {object} props
 * @param {string} props.type
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function NextStepsCard({ type, dismiss, action }) {
    const { t } = useTypedTranslation();
    const message = variants[type]?.(t);
    return (
        <div class={styles.card}>
            <img src={`./icons/${message.icon}-128.svg`} alt="" class={styles.icon} />
            <p class={styles.title}>{message.title}</p>
            <p class={styles.description}>{message.summary}</p>
            <button class={styles.btn} onClick={() => action(message.id)}>
                {message.actionText}
            </button>

            <DismissButton className={styles.dismissBtn} onClick={() => dismiss(message.id)} />
        </div>
    );
}
