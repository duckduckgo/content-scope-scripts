import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { useEnv } from '../../../../../shared/components/EnvironmentProvider'
import { GlobalContext, GlobalDispatch } from '../../global'
import { Panel } from '../../components/Panel'
import { Heading } from '../../components/Heading'
import { ContentGrid } from '../../components/ContentGrid'
import { useTypedTranslation } from '../../types'
import { ElasticButton } from '../../components/Buttons'
import { titles } from '../../data'

/**
 * @param {object} props
 * @param {boolean} [props.isIdle=false]
 * @param {import("preact").ComponentChild} [props.dismissContent]
 * @param {(() => void)|null} [props.dismissHandler]
 * @param {import("preact").ComponentChild} [props.acceptContent]
 * @param {(() => void)|null} [props.acceptHandler]
 * @param {import("preact").ComponentChild} props.children
 */
export function SingleSettingStep ({ isIdle = false, dismissContent, dismissHandler, acceptContent, acceptHandler, children }) {
    const { isReducedMotion, injectName: platform } = useEnv()
    const { activeStep } = useContext(GlobalContext)
    const dispatch = useContext(GlobalDispatch)
    const { t } = useTypedTranslation()

    const enqueueNext = () => {
        if (isReducedMotion) {
            dispatch({ kind: 'advance' })
        } else {
            dispatch({ kind: 'enqueue-next' })
        }
    }

    const title = titles[activeStep].title(t, isIdle, platform)
    const subtitle = titles[activeStep].subtitle(t, isIdle, platform)

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
                currentProgress={1}
                totalProgress={5}
                dismissButton={dismissButton}
                acceptButton={acceptButton}>
                {children}
            </ContentGrid>
        </Panel>
    )
}
