import { h } from 'preact';
import cn from 'classnames';

import styles from './NextSteps.module.css';
import { DismissButton } from '../../components/DismissButton';
import { variants } from '../nextsteps.data';
import { useTypedTranslationWith } from '../../types';
import { CheckColor } from '../../components/Icons';
import { useState } from 'preact/hooks';

/**
 * @param {object} props
 * @param {string} props.type
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function NextStepsCard({ type, dismiss, action }) {
    const { t } = useTypedTranslationWith(/** @type {import("../strings.json")} */ ({}));
    const message = variants[type]?.(t);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const hasConfirmationState = message.id === 'addAppToDockMac';

    const handleClick = () => {
        if (!hasConfirmationState) {
            return action(message.id);
        }

        action(message.id);
        setShowConfirmation(true);
    };
    return (
        <div class={styles.card}>
            <img src={`./icons/${message.icon}-128.svg`} alt="" class={styles.icon} />
            <h3 class={styles.title}>{message.title}</h3>
            <p class={styles.description}>{message.summary}</p>
            {hasConfirmationState && !!showConfirmation ? (
                <div class={styles.confirmation}>
                    <CheckColor />
                    <p>{message.confirmationText}</p>
                </div>
            ) : (
                <button class={cn(styles.btn, hasConfirmationState && styles.supressActiveStateForSwitch)} onClick={handleClick}>
                    {message.actionText}
                </button>
            )}

            <DismissButton className={styles.dismissBtn} onClick={() => dismiss(message.id)} />
        </div>
    );
}
