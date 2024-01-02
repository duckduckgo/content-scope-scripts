import { h } from 'preact'
import styles from './Content.module.css'
import { useAutoAnimate } from '@formkit/auto-animate/preact'

export function Content ({ children }) {
    const [parent] = useAutoAnimate()
    return (
        <div className={styles.indent}>
            <div className={styles.wrapper} ref={parent}>
                {children}
            </div>
        </div>
    )
}
