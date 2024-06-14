// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from 'preact'
import { useState, useEffect, useRef, useContext } from 'preact/hooks'

import { SettingsContext } from '../settings'
import {GlobalContext} from "../global";

/**
 * Renders a component that types out the given text.
 *
 * @param {Object} props - The component props.
 * @param {string} props.text - The text to type out.
 * @param {import("preact").ComponentChild} [props.children=null] - Child components to be rendered.
 * @param {(() => void) | null} [props.onComplete=null] - A callback function to be called when the typing is complete.
 * @param {number} [props.delay=20] - The delay (in milliseconds) between each character being typed.
 */
export function Typed ({ text, children = null, onComplete = null, delay = 20, ...rest }) {
    const globalState = useContext(GlobalContext)
    const { activeStep } = globalState
    const pre = useRef(/** @type {string|undefined} */(undefined));
    useEffect(() => {
        if (activeStep && pre.current) {
            if (text === pre.current) {
                onComplete?.()
                return
            }
        }
        pre.current = text
    }, [activeStep, text])
    return (
        <TypedInner key={text}
                    text={text}
                    onComplete={onComplete}
                    delay={delay}
                    {...rest}>{children}</TypedInner>
    )
}

function TypedInner ({ text, onComplete, delay, children, ...rest }) {
    const { isReducedMotion } = useContext(SettingsContext)
    const [screenWidth, setScreenWidth] = useState(0)
    const [coords, setCoords] = useState({ left: 0, width: 0 })
    const [complete, setLocalComplete] = useState(false)

    const [currentText, setCurrentText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)

    const actual = useRef(/** @type {null | HTMLSpanElement } */(null))
    const overlay = useRef(/** @type {null | HTMLSpanElement} */(null))

    function localOnComplete () {
        onComplete?.()
        setLocalComplete(true)
    }

    useEffect(() => {
        if (isReducedMotion) {
            setCurrentText(text)
            setCurrentIndex(text.length)
        }
    }, [isReducedMotion, localOnComplete])

    useEffect(() => {
        const handler = () => {
            setScreenWidth(window.innerWidth)
        }

        window.addEventListener('resize', handler)
        return () => {
            window.removeEventListener('resize', handler)
        }
    }, [])

    useEffect(() => {
        if (currentIndex < text.length) {
            const timeout = setTimeout(
                () => {
                    setCurrentText((prevText) => prevText + text[currentIndex])
                    setCurrentIndex((prevIndex) => prevIndex + 1)
                },
                text[currentIndex] === '\n' ? delay * 10 : delay
            )

            return () => clearTimeout(timeout)
        } else {
            localOnComplete()
            return () => {}
        }
    }, [currentIndex, delay, text])

    function updatePlacement () {
        const actualCurrent = /** @type {HTMLSpanElement} */(actual.current)
        const overlayCurrent = /** @type {HTMLSpanElement} */(overlay.current)

        if (!actualCurrent || !actualCurrent || !overlayCurrent.parentElement) {
            return
        }

        const actualBox = actualCurrent.getBoundingClientRect()
        const overlayParentBox = overlayCurrent?.parentElement?.getBoundingClientRect()

        setCoords({
            left: actualBox.left - overlayParentBox.left,
            width: actualBox.width
        })
    }

    useEffect(() => {
        updatePlacement()
    }, [screenWidth])

    useEffect(() => {
        const update = setInterval(() => updatePlacement(), 50)
        return () => clearInterval(update)
    }, [])

    return (
        <div
            style={{ position: 'relative', width: '100%', whiteSpace: 'pre-line' }}
            aria-label={text}
            {...rest}
        >
            <span style={{ visibility: 'hidden', paddingRight: '10px' }} ref={actual}>
                {text}
            </span>
            <span
                ref={overlay}
                aria-hidden={false}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: coords.left,
                    width: coords.width,
                    whiteSpace: 'pre-line'
                }}
            >
                {currentText}
                {children && (
                    <span hidden={!complete}>
                        {children}
                    </span>
                )}
            </span>
        </div>
    )
}
