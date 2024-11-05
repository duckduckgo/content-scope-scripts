import { h } from 'preact';
import cn from 'classnames';
import styles from './NextSteps.module.css';
import { Cross } from '../components/Icons.js';
import { variants } from './nextsteps.data';

export function NextStepsCard({ type, action, dismiss }) {
    const message = variants[type];
    return (
        <div class={styles.root}>
            {/* <img src={`../../shared/assets/img/icons/${message.icon}-128.svg`} alt="" class={styles.icon}/> */}
            <img src={`./icons/${message.icon}-128.svg`} alt="" class={styles.icon} />

            <p class={styles.title}>{message.titleText}</p>
            <p class={styles.description}>{message.descriptionText}</p>
            <button class={styles.btn}>{message.actionText}</button>
            <button class={cn(styles.btn, styles.dismissBtn)} onClick={() => dismiss(message.id)} aria-label="Close">
                <Cross />
            </button>
        </div>
    );
}
