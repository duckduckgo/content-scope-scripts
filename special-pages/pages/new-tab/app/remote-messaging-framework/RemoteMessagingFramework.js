import { h } from 'preact'
import cn from 'classnames'
import styles from './RemoteMessagingFramework.module.css'
import MessageIcons from './MessageIcons'
import { useContext } from 'preact/hooks'
import { RMFContext } from './RMFProvider.js'

/**
  * @import { RMFMessage } from "../../../../types/new-tab"
  * @param {object} props
  * @param {RMFMessage} props.message
  * @param {() => void} [props.primaryAction]
  * @param {() => void} [props.secondaryAction]
  */

export function RemoteMessagingFramework ({ message, primaryAction, secondaryAction }) {
    const { id, messageType, titleText, descriptionText } = message
    return (
        <div id={id} class={cn(styles.root, (messageType !== 'small' && message.icon) && styles.icon)}>
            {messageType !== 'small' && message.icon && (
                <span class={styles.iconBlock}>
                    <MessageIcons name={message.icon} />
                </span>
            )}
            <div class={styles.content}>
                <p class={styles.title}>{titleText}</p>
                <p>{descriptionText}</p>
                {messageType === 'big_two_action' && (
                    <div class={styles.btnRow}>
                        {primaryAction && message.primaryActionText.length > 0 && (
                            <button class={cn(styles.btn, styles.primary)} onClick={primaryAction}>{message.primaryActionText}</button>
                        )}
                        {secondaryAction && message.secondaryActionText.length > 0 && (
                            <button class={cn(styles.btn, styles.secondary)} onClick={secondaryAction}>{message.secondaryActionText}</button>
                        )}
                    </div>
                )}
            </div>
            {messageType === 'big_single_action' && message.primaryActionText && primaryAction && (
                <div class={styles.btnBlock}>
                    <button class={cn(styles.btn)} onClick={primaryAction}>{message.primaryActionText}</button>
                </div>
            )}
        </div>

    )
}

export function RMFConsumer () {
    const { state, primaryAction, secondaryAction } = useContext(RMFContext)
    if (state.status === 'ready') {
        return (
            <RemoteMessagingFramework
                message={state.data.content}
                primaryAction={primaryAction}
                secondaryAction={secondaryAction}
            />
        )
    }
    return null
}
