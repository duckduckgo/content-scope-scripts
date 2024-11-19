import { h } from 'preact';
import cn from 'classnames';

import styles from './NextSteps.module.css';
import { DismissButton } from '../../components/DismissButton';
import { variants } from '../nextsteps.data';
import { useTypedTranslation } from '../../types';

/**
 * @param {object} props
 * @param {string} props.type
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 * @param {string} [props.className]
 */

export function NextStepsCard({ type, dismiss, action, className }) {
    const { t } = useTypedTranslation();
    const message = variants[type]?.(t);
    return (
        <div class={cn(styles.card, className)}>
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
