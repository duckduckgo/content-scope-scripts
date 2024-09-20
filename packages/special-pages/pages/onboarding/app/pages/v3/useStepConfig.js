
export function useStepConfig() {
    const enqueueNext = () => {
        if (isReducedMotion) {
            dispatch({ kind: 'advance' })
        } else {
            dispatch({ kind: 'enqueue-next' })
        }
    }

    const dismiss = () => dispatch({ kind: 'dismiss' })

    /** @type {(id: import('../../types').SystemValueId) => void} */
    const enableSystemValue = (id) => dispatch({
        kind: 'update-system-value',
        id,
        payload: { enabled: true },
        current: true
    })

    /** @type {import('./data').StepConfigParams} */
    const configParams = {
        t,
        env,
        global,
        enqueueNext,
        dismiss,
        enableSystemValue
    }
}