import { useCallback, useEffect } from "preact/hooks";

export function FocusMode() {
    useEffect(() => {
        let enabled = true;
        let timerId;
        const on = () => {
            if (document.documentElement.dataset.focusModeState === 'paused') {
                // try again after delay
                wait()
            } else {
                if (!enabled) return;
                document.documentElement.dataset.focusMode = 'on'
            }
        }
        const off = () => document.documentElement.dataset.focusMode = 'off'
        const cancel = () => {
            clearTimeout(timerId);
            off()
            wait()
        }
        const wait = () => {
            clearTimeout(timerId)
            timerId = setTimeout(on, 2000)
        }

        // start
        wait()

        // event listeners on the top document
        document.addEventListener('mousemove', cancel)
        document.addEventListener('pointerdown', cancel)

        // other events that might occur
        window.addEventListener('frame-mousemove', cancel)
        window.addEventListener('ddg-duckplayer-focusmode-off', () => {
            enabled = false;
            off()
        })

        return () => {
            clearTimeout(timerId);
        }
    }, [])
    return null
}

/**
 * Allow a mechanism for pausing focus mode - for example, when a tooltip is open
 */
export function useSetFocusMode() {
    return useCallback((/** @type {'enabled' | 'disabled' | 'paused'} */action) => {
        document.documentElement.dataset.focusModeState = action
    }, [])
}
