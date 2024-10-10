import { h } from 'preact'
import { useState, useRef } from 'preact/hooks'
import styles from './EasterEgg.module.css'

/**
 * @param {object} props
 * @param {h.JSX.MouseEventHandler<HTMLDivElement>} props.onClick
 */
function Overlay({ onClick }) {
    return (
        <div className={styles.overlay} onClick={onClick}>
            <h1>Want to help us squash bugs?</h1>
            <p>Click to start</p>
        </div>
    )
}

export function EasterEgg() {
    const [started, setStarted] = useState(false)
    /** @type {import('preact/hooks').MutableRef<HTMLIFrameElement|null>} */
    const ref = useRef(null)

    const clickHandler = () => {
        setStarted(true)
    }

    const loadHandler = () => {
        if (ref.current) {
            ref.current.contentWindow?.focus()
        }
    }

    return (
        <div className={styles.container}>
            { started
                ? <iframe src="game/index.html" className={styles.iframe} ref={ref} onLoad={loadHandler}></iframe>
                : <Overlay onClick={clickHandler}/>}
        </div>
    )
}