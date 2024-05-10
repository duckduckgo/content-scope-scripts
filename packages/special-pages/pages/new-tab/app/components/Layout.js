import { h } from 'preact'
import styles from './Layout.module.css'
import { Stack } from '../../../../shared/components/Stack'

export function Layout ({ children }) {
    return (
        <div className={styles.layout}>
            <Stack gap={'var(--sp-7)'}>
                {children}
            </Stack>
        </div>
    )
}
