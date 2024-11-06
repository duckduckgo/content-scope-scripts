import { h } from 'preact';
import cn from 'classnames';
import styles from './NextSteps.module.css';
import { Cross } from '../components/Icons.js';
import { oldVariants } from './nextsteps.data';
// import { useTypedTranslation } from "../types"
// const {t} = useTypedTranslation()

export function NextStepsCard({ type, dismiss }) {
    // const message = variants[type]?.(t)
    const message = oldVariants[type];
    return (
        <div class={styles.root}>
            {/* <img src={`../../shared/assets/img/icons/${message.icon}-128.svg`} alt="" class={styles.icon}/> */}
            <img src={`./icons/${message.icon}-128.svg`} alt="" class={styles.icon} />

            <p class={styles.title}>{message.title}</p>
            <p class={styles.description}>{message.summary}</p>
            <button class={styles.btn}>{message.actionText}</button>
            <button class={cn(styles.btn, styles.dismissBtn)} onClick={() => dismiss(message.id)} aria-label="Close">
                <Cross />
            </button>
        </div>
    );
}
