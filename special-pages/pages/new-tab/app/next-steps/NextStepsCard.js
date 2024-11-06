import { h } from 'preact';
import cn from 'classnames';
import styles from './NextSteps.module.css';
import { Cross } from '../components/Icons.js';
// import { oldVariants } from './nextsteps.data';
import { variants } from './nextsteps.data2.js';
import { useTypedTranslation } from '../types.js';
// import { useTypedTranslation } from "../types"
// const {t} = useTypedTranslation()

// NextStepType = "bringStuff" | "defaultApp" | "blockCookies" | "emailProtection" | "duckPlayer" | "addAppDockMac" | "pinAppToTaskbar"

/*
 * @param {object} props
 * @param {string} props.type
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function NextStepsCard({ type, dismiss, action }) {
    const { t } = useTypedTranslation();
    const message = variants[type]?.(t);
    // console.log({ type });
    // const message = oldVariants[type];
    console.log({ message });
    return (
        <div class={styles.root}>
            {/* <img src={`../../shared/assets/img/icons/${message.icon}-128.svg`} alt="" class={styles.icon}/> */}
            <img src={`./icons/${message.icon}-128.svg`} alt="" class={styles.icon} />

            <p class={styles.title}>{message.title}</p>
            <p class={styles.description}>{message.summary}</p>
            <button class={styles.btn} onClick={() => action(message.id)}>
                {message.actionText}
            </button>
            <button class={cn(styles.btn, styles.dismissBtn)} onClick={() => dismiss(message.id)} aria-label="Close">
                <Cross />
            </button>
        </div>
    );
}

// export function NextStepsConsumer () {

// }
