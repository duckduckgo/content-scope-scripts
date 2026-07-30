import { h, Fragment } from 'preact';
import cn from 'classnames';
import styles from './RemoteMessagingFramework.module.css';
import { useContext } from 'preact/hooks';
import { RMFContext } from '../RMFProvider.js';
import { DismissButton } from '../../components/DismissButton';
import { Button } from '../../../../../shared/components/Button/Button';
import { usePlatformName, useNewTabPageRebranding } from '../../settings.provider';

/**
 * @import { RMFMessage, BigTwoActionMessage } from "../../../types/new-tab"
 */

/**
 * @param {object} props
 * @param {string} props.platform
 * @param {string} props.id
 * @param {BigTwoActionMessage} props.message
 * @param {(id: string) => void} [props.primaryAction]
 * @param {(id: string) => void} [props.secondaryAction]
 */
function TwoActionButtons({ platform, id, message, primaryAction, secondaryAction }) {
    const primaryBtn = primaryAction && message.primaryActionText.length > 0 && (
        <Button className={cn(styles.actionButton, styles.primaryButton)} variant={'accentBrand'} onClick={() => primaryAction(id)}>
            {message.primaryActionText}
        </Button>
    );
    const secondaryBtn = secondaryAction && message.secondaryActionText.length > 0 && (
        <Button className={cn(styles.actionButton, styles.secondaryButton)} variant={'standard'} onClick={() => secondaryAction(id)}>
            {message.secondaryActionText}
        </Button>
    );
    return (
        <div class={styles.btnRow}>
            {platform === 'windows' ? (
                <Fragment>
                    {primaryBtn}
                    {secondaryBtn}
                </Fragment>
            ) : (
                <Fragment>
                    {secondaryBtn}
                    {primaryBtn}
                </Fragment>
            )}
        </div>
    );
}

/**
 * @param {object} props
 * @param {RMFMessage} props.message
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} [props.primaryAction]
 * @param {(id: string) => void} [props.secondaryAction]
 */
export function RemoteMessagingFramework({ message, primaryAction, secondaryAction, dismiss }) {
    const { id, messageType, titleText, descriptionText } = message;
    const platform = usePlatformName();
    const isRebrandEnabled = useNewTabPageRebranding();
    const showIcon = messageType !== 'small' && Boolean(message.icon);
    const iconSrc = showIcon ? (isRebrandEnabled ? `./icons/rebrand/${message.icon}-96.svg` : `./icons/${message.icon}-96.svg`) : undefined;

    return (
        <div id={id} class={cn(styles.root, showIcon && styles.icon)}>
            {showIcon && iconSrc && (
                <span class={styles.iconBlock}>
                    <img src={iconSrc} alt="" />
                </span>
            )}
            <div class={styles.content}>
                <h2 class={styles.title}>{titleText}</h2>
                <p class={styles.description}>{descriptionText}</p>
                {messageType === 'big_two_action' && (
                    <TwoActionButtons
                        platform={platform}
                        id={id}
                        message={message}
                        primaryAction={primaryAction}
                        secondaryAction={secondaryAction}
                    />
                )}
            </div>
            {messageType === 'big_single_action' && message.primaryActionText && primaryAction && (
                <div class={styles.btnBlock}>
                    <Button className={cn(styles.actionButton, styles.secondaryButton)} variant="standard" onClick={() => primaryAction(id)}>
                        {message.primaryActionText}
                    </Button>
                </div>
            )}
            <DismissButton className={styles.dismissBtn} onClick={() => dismiss(id)} />
        </div>
    );
}

export function RMFConsumer() {
    const { state, primaryAction, secondaryAction, dismiss } = useContext(RMFContext);

    // `state.data.content` can be empty - meaning there's no message to display!
    if (state.status === 'ready' && state.data.content) {
        return (
            <RemoteMessagingFramework
                message={state.data.content}
                primaryAction={primaryAction}
                secondaryAction={secondaryAction}
                dismiss={dismiss}
            />
        );
    }
    return null;
}
