import { useEffect } from 'preact/hooks'

export function useDismiss (contentRef, close) {
    useEffect(() => {
        const handler = (e) => {
            if (e.code === 'Escape') close()
        }
        const clickHandler = (e) => {
            if (!e.target.isConnected) return
            if (!contentRef.current?.contains(e.target)) {
                close()
            }
        }
        window.addEventListener('keyup', handler)
        window.addEventListener('click', clickHandler)

        return () => {
            window.removeEventListener('keyup', handler)
            window.removeEventListener('click', clickHandler)
        }
    }, [close, contentRef])
}
