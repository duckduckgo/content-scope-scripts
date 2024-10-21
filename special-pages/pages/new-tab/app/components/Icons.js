import { h } from 'preact'
import styles from './Icons.module.css'

export function ChevronButton () {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class={styles.chevron}>
            <rect fill="black" fill-opacity="0.06" width="24" height="24" rx="12" class={styles.chevronCircle} />
            <path fill="black" fill-opacity="0.6"
                class={styles.chevronArrow}
                d="M6.90039 10.191C6.91514 9.99804 7.00489 9.81855 7.15039 9.69098C7.2879 9.56799 7.46591 9.5 7.65039 9.5C7.83487 9.5 8.01289 9.56799 8.15039 9.69098L12.1504 13.691L16.1504 9.69098C16.2903 9.62414 16.4476 9.60233 16.6004 9.62856C16.7533 9.65479 16.8943 9.72776 17.0039 9.83743C17.1136 9.9471 17.1866 10.0881 17.2128 10.2409C17.239 10.3938 17.2172 10.551 17.1504 10.691L12.6504 15.191C12.5098 15.3314 12.3191 15.4103 12.1204 15.4103C11.9216 15.4103 11.731 15.3314 11.5904 15.191L7.15039 10.691C7.00489 10.5634 6.91514 10.3839 6.90039 10.191Z"/>
        </svg>
    )
}
