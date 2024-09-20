import { useContext } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { GlobalContext, GlobalDispatch } from '../../global'
import { useTypedTranslation } from '../../types'
import { stepsConfig } from './data'

/**
 *
 * @returns {import('./data').StepConfigParams & { stepConfig: import('./data').StepConfig }}
 */
export function useStepConfig () {
    const env = useEnv()
    const global = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const { isReducedMotion } = env
    const { activeStep } = global

    const enqueueNext = () => {
        if (isReducedMotion) {
            dispatch({ kind: 'advance' })
        } else {
            dispatch({ kind: 'enqueue-next' })
        }
    }

    const dismiss = () => dispatch({ kind: 'dismiss' })

    /** @type {(value: 'before'|'after') => void} */
    const setBeforeAfter = (value) => dispatch({ kind: 'set-before-after', value })

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
        enableSystemValue,
        setBeforeAfter
    }

    if (!stepsConfig[activeStep]) {
        throw new Error(`Missing step config for ${activeStep}`)
    }

    return {
        ...configParams,
        stepConfig: stepsConfig[activeStep](configParams)
    }
}
