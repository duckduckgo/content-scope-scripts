import styles from './App.module.css'
import classNames from 'classnames'
import { h } from 'preact'

export function Background () {
    return (
        <div className={styles.background}>
            <div className={classNames(styles.foreground, styles.layer1)}/>
            <div className={classNames(styles.foreground, styles.layer2)}/>
            <div className={classNames(styles.foreground, styles.layer3)}/>
        </div>
    )
}
