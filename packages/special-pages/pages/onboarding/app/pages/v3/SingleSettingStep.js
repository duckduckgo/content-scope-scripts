import { h } from 'preact'
import { Panel } from '../../components/Panel'
import { Heading } from '../../components/Heading'
import { ContentGrid } from '../../components/ContentGrid'
import { ElasticButton } from '../../components/Buttons'
import { useStepConfig } from './useStepConfig'

/**
 * @param {object} props
 * @param {number} [props.currentProgress]
 * @param {number} [props.totalProgress]
 */
export function SingleSettingStep ({ currentProgress, totalProgress }) {
    const { enqueueNext, stepConfig } = useStepConfig()
    const { title, subtitle, dismissContent, dismissHandler, acceptContent, acceptHandler, content } = stepConfig

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
