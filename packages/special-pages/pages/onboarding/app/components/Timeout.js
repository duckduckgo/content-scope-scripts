import { useContext, useEffect, useState } from 'preact/hooks'
import { h } from 'preact'
import { SettingsContext } from '../settings'

/**
 * Renders the first page of the application and provides an option to move to the next page.
 *
 * @param {Object} props - The component props.
 * @param {() => void} props.onComplete - Callback function to be called when the "Get Started" button is clicked.
 * @param {number} [props.timeout] - Callback function to be called when the "Get Started" button is clicked.
 * @param {boolean} [props.ignore] - Callback function to be called when the "Get Started" button is clicked.
 */
export function Timeout ({ onComplete, ignore, timeout = 1000 }) {
    const { isReducedMotion } = useContext(SettingsContext)
    useEffect(() => {
        let int
        if (ignore) {
            int = setTimeout(onComplete, timeout)
        } else {
            int = setTimeout(onComplete, isReducedMotion ? 0 : timeout)
        }
        return () => clearTimeout(int)
    }, [onComplete, timeout, isReducedMotion, ignore])
    return <div/>
}
/**
 * Renders the first page of the application and provides an option to move to the next page.
 *
 * @param {Object} props - The component props.
 * @param {import("preact").ComponentChild} props.children - Callback function to be called when the "Get Started" button is clicked.
 * @param {number} props.ms - Callback function to be called when the "Get Started" button is clicked.
 * @return {any}
 */
export function Delay ({ children, ms = 1000 }) {
    const [shown, setShown] = useState(false)
    const { isReducedMotion } = useContext(SettingsContext)
    useEffect(() => {
        const int = setTimeout(() => setShown(true), isReducedMotion ? 0 : ms)
        return () => clearTimeout(int)
    }, [ms, isReducedMotion])
    if (shown) return children
    if (!children) throw new Error('unreachable.')
    return null
}
