import { h } from 'preact'
import styles from './App.module.css'
import { usePlatformName } from '../settings.provider.js'

export function App ({ children }) {
    const platformName = usePlatformName()
    return (
        <div className={styles.layout} data-platform={platformName}>
            {children}
        </div>
    )
}
