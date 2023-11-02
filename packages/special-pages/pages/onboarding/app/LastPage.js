import { h, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import classNames from 'classnames'
import styles from '../src/js/styles.module.css'
import { Header } from './Header'

export function LastPage({ onNextPage, stepResults }) {
    return <>
        <Header title="done" />

        <div className={styles.wrapper}>

            <button className={classNames(styles.primary, styles.large)} onClick={() => onNextPage()}>Next</button>

        </div>
    </>
}
