import { h } from 'preact'
import cn from 'classnames'
import { useStepConfig } from './useStepConfig'
import { Heading } from '../Heading'
import { SingleLineProgress } from '../Progress'
import { ElasticButton } from '../Buttons'

import styles from './SingleStep.module.css'

/**
 * @param {object} props
 * @param {string} props.text
 * @param {h.JSX.Element} [props.startIcon]
 * @param {h.JSX.Element} [props.endIcon]
 * @param {() => void} props.handler
 */
export function DismissButton ({ text, startIcon, endIcon, handler }) {
    return (
        <ElasticButton grow={false} onClick={handler} variant='secondary'>
            {startIcon}
            {text}
            {endIcon}
        </ElasticButton>
    )
}

/**
 * @param {object} props
 * @param {string} props.text
 * @param {h.JSX.Element} [props.startIcon]
 * @param {h.JSX.Element} [props.endIcon]
 * @param {() => void} props.handler
 */
export function AcceptButton ({ text, startIcon, endIcon, handler }) {
    return (
        <ElasticButton onClick={handler}>
            {startIcon}
            {text}
            {endIcon}
        </ElasticButton>
    )
}

export function SingleStep () {
    const { variant, heading, dismissButton, acceptButton, content, progress } = useStepConfig()

    const classes = cn({
        [styles.panel]: true,
        [styles.boxed]: variant === 'box'
    })

    return (
        <div className={classes}>
            <Heading {...heading} />

            { content && <div className={styles.container}>
                <div className={styles.content}>
                    {content}
                </div>
                <div className={styles.progress}>
                    <SingleLineProgress current={progress.current} total={progress.total} />
                </div>

                <div className={styles.spacer}></div>

                <div className={styles.skip}>
                    {dismissButton && <DismissButton {...dismissButton} />}
                </div>

                <div className={styles.accept}>
                    {acceptButton && <AcceptButton {...acceptButton} />}
                </div>
            </div>}
        </div>
    )
}
