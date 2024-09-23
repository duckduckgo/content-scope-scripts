import { useContext } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { GlobalContext, GlobalDispatch } from '../../global'
import { useTypedTranslation } from '../../types'
import { stepsConfig } from './data'

/**
 *
 * @returns {import('./data-types').StepData}
 */
export function useStepConfig () {
    const env = useEnv()
    const globalState = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const { isReducedMotion } = env
    const { activeStep, order } = globalState

    /** @type {import('../../types').Step['id'][]} */
    const progressSteps = order.slice(2, order.length)
    /** @type {import('./data-types').Progress} */
    const progress = {
        current: progressSteps.indexOf(activeStep) + 1,
        total: progressSteps.length
    }

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

    /** @type {import('./data-types').StepConfigParams} */
    const configParams = {
        t,
        env,
        globalState,
        enqueueNext,
        dismiss,
        enableSystemValue,
        setBeforeAfter,
        progress
    }

    if (!stepsConfig[activeStep]) {
        throw new Error(`Missing step config for ${activeStep}`)
    }

    return {
        ...configParams,
        ...stepsConfig[activeStep](configParams)
    }
}
