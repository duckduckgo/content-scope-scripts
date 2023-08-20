import styles from './switch.module.css'
/**
 * @param {object} props
 * @param {boolean} props.checked
 * @param {string} props.id
 * @param {(checked: import('react').ChangeEvent<HTMLInputElement>) => void} props.onChange
 * @param {boolean} props.disabled
 * @param {import("react").ReactNode} props.children
 */
export function Switch(props) {
    return (
        <label className={styles.switch}>
            <input
                type='checkbox'
                name='toggle'
                className={styles.input}
                value={props.id}
                checked={props.checked}
                onChange={props.onChange}
                disabled={props.disabled}
            />
            <span className={styles.display} hidden>
                <svg width='18'
                     height='14'
                     viewBox='0 0 18 14'
                     fill='none'
                     xmlns='http://www.w3.org/2000/svg'
                     aria-hidden="true"
                     focusable="false"
                     className={[styles.icon, styles.icon_checkmark].join(" ")}>
                  <path
                      d='M6.08471 10.6237L2.29164 6.83059L1 8.11313L6.08471 13.1978L17 2.28255L15.7175 1L6.08471 10.6237Z'
                      fill='currentcolor' stroke='currentcolor'/>
                </svg>
                <svg width='13'
                     height='13'
                     viewBox='0 0 13 13'
                     fill='none'
                     xmlns='http://www.w3.org/2000/svg'
                     aria-hidden="true"
                     focusable="false"
                     className={[styles.icon, styles.icon_cross].join(" ")}>
                  <path
                      d='M11.167 0L6.5 4.667L1.833 0L0 1.833L4.667 6.5L0 11.167L1.833 13L6.5 8.333L11.167 13L13 11.167L8.333 6.5L13 1.833L11.167 0Z'
                      fill='currentcolor'/>
                </svg>
            </span>
        </label>
    )
}
