import { h } from 'preact'
import styles from './App.module.css'

export function App ({ children }) {
    return (
        <div className={styles.layout}>
            {children}
        </div>
    )
}
