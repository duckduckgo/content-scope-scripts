import { h, Fragment } from 'preact'
import { useAutoAnimate } from '@formkit/auto-animate/preact'
import { useReducer } from 'preact/hooks'
import { Stack } from './Stack'
import { Button, ButtonBar } from './Buttons'
import { Play, Replay, SlideIn } from './Icons'

import styles from './BeforeAfter.module.css'
import { useTranslation } from '../translations'

/**
 * A component that renders an image with a before and after effect.
 *
 * @param {Object} props - The parameters for the component.
 * @param {() => void} props.onDone - The function to be called when the "Got it" button is clicked.
 * @param {string} props.imgBefore - The URL of the image to be shown before the effect.
 * @param {string} props.imgAfter - The URL of the image to be shown after the effect.
 * @param {string} props.btnBefore - The label for the button to show the before effect.
 * @param {string} props.btnAfter - The label for the button to show the after effect.
 */
export function BeforeAfter ({ onDone, imgBefore, imgAfter, btnBefore, btnAfter }) {
    const [imageParent] = useAutoAnimate()
    const { t } = useTranslation()

    // differentiate between initial states vs before/after
    const [state, dispatch] = useReducer((/** @type {'initial' | 'before' | 'after'} */prev) => {
        if (prev === 'initial') return 'after'
        if (prev === 'before') return 'after'
        if (prev === 'after') return 'before'
        throw new Error('unreachable')
    }, 'initial')

    const src = state === 'after'
        ? imgAfter
        : imgBefore

    return (
        <Stack gap='var(--sp-3)'>
            <div className={styles.imgWrap} ref={imageParent}><img key={src} src={src} style={styles.img}/></div>
            <ButtonBar>
                <Button variant={'secondary'} onClick={() => dispatch('toggle')}>
                    {state === 'after' && (
                        <>
                            <Replay/>{btnAfter}
                        </>
                    )}
                    {(state === 'before' || state === 'initial') && (
                        <>
                            <Play/>{btnBefore}
                        </>
                    )}
                </Button>
                {state !== 'initial' && (
                    <SlideIn delay="double"><Button variant={'secondary'} onClick={onDone}>{t('Got it')}</Button></SlideIn>
                )}
            </ButtonBar>
        </Stack>
    )
}
