import { useEffect } from 'preact/hooks'

/**
 * Allow features to opt-in to the Customizer window
 *
 * @param {object} params
 * @param {import('../../../../types/new-tab').LayoutVisibility} params.visibility
 * @param {() => void} params.toggle
 * @param {Omit<import('../providers/customizer.provider').CustomizerItem, 'state'>} params.data
 */
export function useCustomizer (params) {
    const { visibility, toggle, data } = params

    useEffect(() => {
        const nextData = {
            ...data,
            state: visibility === 'visible' ? 'enabled' : 'disabled'
        }

        const collectEvent = 'customizer-collector'
        const toggleEvent = 'customizer-toggle-' + nextData.id

        /**
         * First, we handle the 'collector' event. If we are 'connected' that means
         * we've decided to show the widget one way or another - so it's always safe to
         * call `add` on the event
         *
         * @param {CustomEvent<{add?: (item: Record<string, any>) => void}>} e
         */
        function handleCustomizerCollect (e) {
            if (e.detail && typeof e.detail.add === 'function') {
                e.detail.add(nextData)
            }
        }
        window.addEventListener(collectEvent, handleCustomizerCollect)

        /**
         * Handle a 'toggle' event. We perform our own state persistence and
         * then just send back the same data, but with updated 'state'
         */
        function handleCustomizerUpdate (e) {
            if (e.detail && typeof e.detail.next === 'function') {
                const nextState = visibility === 'visible' ? 'disabled' : 'enabled'
                toggle()
                e.detail.next({ ...nextData, state: nextState })
            }
        }
        window.addEventListener(toggleEvent, handleCustomizerUpdate)

        return () => {
            window.removeEventListener(collectEvent, handleCustomizerCollect)
            window.removeEventListener(toggleEvent, handleCustomizerUpdate)
        }
    }, [data, visibility, toggle])
}
