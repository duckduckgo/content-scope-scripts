import { h } from 'preact';
import cn from 'classnames';
import { useStepConfig } from '../hooks/useStepConfig';
import { useGlobalDispatch } from '../../global';
import { Heading } from './Heading';
import { SingleLineProgress } from '../../shared/components/Progress';
import { ElasticButton } from './ElasticButton';
import { Stack } from '../../shared/components/Stack';
import { FadeIn } from '../../shared/components/Icons';
import { SlideIn } from './Animation';

import styles from './SingleStep.module.css';

/**
 * @param {object} props
 * @param {import('../data/data-types').Progress} props.progress
 * @param {import('preact').JSX.Element|null} [props.dismissButton]
 * @param {import('preact').JSX.Element|null} [props.acceptButton]
 * @param {boolean} [props.hideProgress]
 * @param {'fade'|'slide'} [props.buttonAnimation] - Animation style for the button bar
 * @param {import('preact').ComponentChild} [props.children]
 */
export function StepGrid({ progress, dismissButton, acceptButton, hideProgress, buttonAnimation = 'slide', children }) {
    const ButtonAnimation = buttonAnimation === 'fade' ? FadeIn : SlideIn;
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <Stack animate>{children}</Stack>
            </div>
            <div className={styles.progress}>
                {!hideProgress && <SingleLineProgress current={progress.current} total={progress.total} />}
            </div>

            <div className={styles.buttonBar}>
                {(dismissButton || acceptButton) && (
                    <ButtonAnimation>
                        <div class={styles.buttonBarContents}>
                            <div className={styles.dismiss}>{dismissButton}</div>

                            <div className={styles.accept}>{acceptButton}</div>
                        </div>
                    </ButtonAnimation>
                )}
            </div>
        </div>
    );
}

export function SingleStep() {
    const dispatch = useGlobalDispatch();
    const { variant, heading, dismissButton, acceptButton, content, progress, globalState } = useStepConfig();

    const classes = cn({
        [styles.panel]: true,
        [styles.boxed]: variant === 'box',
    });

    const onTitleComplete = () => dispatch({ kind: 'title-complete' });

    return (
        <div className={classes}>
            <Stack animate>
                <div className={styles.heading}>
                    <Heading {...heading} onTitleComplete={onTitleComplete} />
                </div>

                {content && (
                    <StepGrid
                        progress={progress}
                        hideProgress={!!globalState.overlay}
                        buttonAnimation={globalState.overlay ? 'fade' : 'slide'}
                        dismissButton={
                            dismissButton && (
                                <ElasticButton {...dismissButton} elastic={false} variant="secondary" onClick={dismissButton.handler} />
                            )
                        }
                        acceptButton={
                            acceptButton && (
                                <ElasticButton {...acceptButton} elastic={true} variant="primary" onClick={acceptButton.handler} />
                            )
                        }
                    >
                        {content}
                    </StepGrid>
                )}
            </Stack>
        </div>
    );
}
