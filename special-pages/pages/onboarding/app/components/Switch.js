import { h } from 'preact'
import styles from './Switch.module.css'
import { useEnv } from '../../../../shared/components/EnvironmentProvider'

/**
 * Switch component used to toggle between two states.
 *
 * @param {Object} props - The props object.
 * @param {string} props.ariaLabel - Label applied to the <input />
 * @param {ImportMeta['injectName']} [props.variant]
 * @param {boolean} props.pending - Indicates if the switch is in a pending state.
 * @param {boolean} [props.checked=false] - Indicates if the switch is checked.
 * @param {Function} props.onChecked - Callback function to be called when the switch is checked.
 * @param {Function} props.onUnchecked - Callback function to be called when the switch is unchecked.
 */
export function Switch({ checked = false, variant, ...props }) {
    const { onChecked, onUnchecked, ariaLabel, pending } = props
    const env = useEnv()
    const platform = variant || env.injectName
    function change(e) {
        if (e.target.checked === true) {
            onChecked()
        } else {
            onUnchecked()
        }
    }
    return (
        <label className={styles.toggleSwitch} data-variant={platform}>
            <input
                disabled={pending}
                type="checkbox"
                role="switch"
                aria-label={ariaLabel}
                className={styles.input}
                checked={checked}
                onChange={change}
            />
            <span className={styles.switch} style="transition-duration: 130ms;transition-delay: 0ms;"></span>
        </label>
    )
}
