import { h } from 'preact';
import styles from './NextSteps.module.css';
import { DismissButton } from '../../components/DismissButton';
import { variants } from '../nextsteps.data';
import { useTypedTranslationWith } from '../../types';

/**
 * @param {object} props
 * @param {string} props.type
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function NextStepsCard({ type, dismiss, action }) {
    const { t } = useTypedTranslationWith(/** @type {import("../strings.json")} */ ({}));
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
