import { h } from "preact";
import cn from "classnames";
import styles from "./SwitchBar.module.css"
import { useContext } from "preact/hooks";
import { SwitchContext } from "../providers/SwitchProvider.jsx";
import { Switch } from "./Switch.jsx";
import { useTypedTranslation } from "../types.js";

/**
 * Renders a switch bar component.
 *
 * @param {Object} props - The properties for the switch bar component.
 * @param {ImportMeta['platform']} props.platformName - The name of the platform.
 */
export function SwitchBarMobile({ platformName }) {
    const { onChange, onDone, state } = useContext(SwitchContext);
    const { t } = useTypedTranslation();

    function blockClick(e) {
        if (state === 'exiting') {
            return e.preventDefault()
        }
    }
    function onTransitionEnd(e) {
        // check it's the root element that's finished animating
        if (e.target?.dataset?.state === 'exiting') {
            onDone()
        }
    }

    return (
        <div class={cn(styles.switchBar, {
                [styles.stateExiting]: state === 'exiting',
                [styles.stateHidden]: state === 'completed',
            })}
            data-state={state}
            onTransitionEnd={onTransitionEnd}>
            <label onClick={blockClick} class={styles.label}>
                <span className={styles.text}>
                    {t('keepEnabled')}
                </span>
                <Switch
                    checked={state !== 'showing'}
                    onChange={onChange}
                    platformName={platformName}
                />
            </label>
        </div>
    )
}
