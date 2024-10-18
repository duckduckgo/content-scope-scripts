import { h, Fragment } from 'preact'
import cn from 'classnames'
import styles from './RemoteMessagingFramework.module.css'
import MessageIcons from './MessageIcons'

/**
 * @import { RMFMessage } from "../../../../types/new-tab"
 * @param {object} props
 * @param {RMFMessage} props.message
 * @param {() => void} [props.primaryAction]
 * @param {() => void} [props.secondaryAction]
 */
export function RemoteMessagingFramework ({ message, primaryAction, secondaryAction }) {
    const { messageType, titleText, descriptionText } = message
    const icon = messageType !== 'small' && message.icon

    const handlePrimaryClick = () => {
        primaryAction?.()
    }

    const handleSecondaryClick = () => {
        secondaryAction?.()
    }

    return (
        <>
            <p>
                {messageType}
            </p>
            <div class={cn(styles.root, icon && styles.icon)}>
                {icon && (
                    <span class={styles.iconBlock}>
                        <MessageIcons name={icon} />
                    </span>
                )}
                <div class={styles.content}>
                    <p class={styles.title}>{titleText}</p>
                    <p>{descriptionText}</p>
                    {messageType === 'big_two_action' && (
                        <div className="buttonRow">
                            {message.primaryActionText.length && (
                                <button class={cn(styles.btn, styles.primary)} onClick={handlePrimaryClick}>{message.primaryActionText}</button>
                            )}
                            {message.secondaryActionText.length > 0 && (
                                <button class={cn(styles.btn, styles.secondary)} onClick={handleSecondaryClick}>{message.secondaryActionText}</button>
                            )}
                        </div>
                    )}
                </div>
                {messageType === 'big_single_action' && message.primaryActionText && primaryAction && (
                    <button class={cn(styles.btn)} onClick={handlePrimaryClick}>{message.primaryActionText}</button>
                )}
            </div>
        </>
    )
}
