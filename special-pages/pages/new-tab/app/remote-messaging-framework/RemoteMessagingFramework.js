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
  * @param {(id: string) => void} props.dismiss
  * @param {(id: string) => void} [props.primaryAction]
  * @param {(id: string) => void} [props.secondaryAction]
  */

export function RemoteMessagingFramework ({ message, primaryAction, secondaryAction, dismiss }) {
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
                            <button class={cn(styles.btn, styles.primary)} onClick={() => primaryAction(id)}>{message.primaryActionText}</button>
                        )}
                        {secondaryAction && message.secondaryActionText.length > 0 && (
                            <button class={cn(styles.btn, styles.secondary)} onClick={() => secondaryAction(id)}>{message.secondaryActionText}</button>
                        )}
                    </div>
                )}
            </div>
            {messageType === 'big_single_action' && message.primaryActionText && primaryAction && (
                <div class={styles.btnBlock}>
                    <button class={cn(styles.btn)} onClick={() => primaryAction(id)}>{message.primaryActionText}</button>
                </div>
            )}
            <button className={cn(styles.btn, styles.dismissBtn)} onClick={() => dismiss(id)} aria-label="Close">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" >
                    <path d="M11.4419 5.44194C11.686 5.19786 11.686 4.80214 11.4419 4.55806C11.1979 4.31398 10.8021 4.31398 10.5581 4.55806L8 7.11612L5.44194 4.55806C5.19786 4.31398 4.80214 4.31398 4.55806 4.55806C4.31398 4.80214 4.31398 5.19786 4.55806 5.44194L7.11612 8L4.55806 10.5581C4.31398 10.8021 4.31398 11.1979 4.55806 11.4419C4.80214 11.686 5.19786 11.686 5.44194 11.4419L8 8.88388L10.5581 11.4419C10.8021 11.686 11.1979 11.686 11.4419 11.4419C11.686 11.1979 11.686 10.8021 11.4419 10.5581L8.88388 8L11.4419 5.44194Z" fill="currentColor" />
                </svg></button>
        </div>

    )
}

export function RMFConsumer () {
    const { state, primaryAction, secondaryAction, dismiss } = useContext(RMFContext)

    // `state.data.content` can be empty - meaning there's no message to display!
    if (state.status === 'ready' && state.data.content) {
        return (
            <RemoteMessagingFramework
                message={state.data.content}
                primaryAction={primaryAction}
                secondaryAction={secondaryAction}
                dismiss={dismiss}
            />
        )
    }
    return null
}
