import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { GlobalContext, GlobalDispatch } from '../../global'
import { Panel } from '../../components/Panel'
import { Heading } from '../../components/Heading'
import { ContentGrid } from '../../components/ContentGrid'
import { useTypedTranslation } from '../../types'
import { ElasticButton } from '../../components/Buttons'
import { stepsConfig } from './data'

/**
 * @param {object} props
 * @param {number} [props.currentProgress]
 * @param {number} [props.totalProgress]
 */
export function SingleSettingStep ({ currentProgress, totalProgress }) {
    const env = useEnv()
    const global = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const { isReducedMotion, injectName: platform } = env
    const { activeStep } = global

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

    if (!stepsConfig[activeStep]) {
        console.warn(`Missing step config for ${activeStep}`)
        return null
    }

    const { title, subtitle, dismissContent, dismissHandler, acceptContent, acceptHandler, content } = stepsConfig[activeStep](configParams)

    const dismissButton = dismissContent
        ? <ElasticButton grow={false} onClick={dismissHandler || enqueueNext} variant='secondary'>
            {dismissContent}
        </ElasticButton>
        : null

    const acceptButton = acceptContent ? <ElasticButton onClick={acceptHandler || enqueueNext}>{acceptContent}</ElasticButton> : null

    return (
        <Panel boxed={true}>
            <Heading title={title} subtitle={subtitle} speechBubble={true} />

            <ContentGrid
                currentProgress={currentProgress}
                totalProgress={totalProgress}
                dismissButton={dismissButton}
                acceptButton={acceptButton}>
                    {content}
            </ContentGrid>
        </Panel>
    )
}
