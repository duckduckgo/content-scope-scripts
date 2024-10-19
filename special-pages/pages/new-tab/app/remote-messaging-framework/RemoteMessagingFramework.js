import { h, Fragment } from 'preact'
import cn from 'classnames'
import styles from './RemoteMessagingFramework.module.css'
import MessageIcons from './MessageIcons'

/**
 *
 * @param {object} props;
 */

// icon : "Announce"|"DDGAnnounce"|"CriticalUpdate"|"AppUpdate"
// messageType : "small"|"medium"|"big_single_action"|"big_two_action"

export function RemoteMessagingFramework (props) {
    const { id, messageType, titleText, descriptionText, icon, primaryActionText = '', primaryAction, secondaryActionText = '', secondaryAction } = props

    const handlePrimaryClick = () => {
        primaryAction()
    }

    const handleSecondaryClick = () => {
        secondaryAction()
    }

    return (
        <>
            <p>
                {messageType}
            </p>
            <div id={id} class={cn(styles.root, icon && styles.icon)}>
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
                            {primaryActionText.length && (
                                <button class={cn(styles.btn, styles.primary)} onClick={handlePrimaryClick}>{primaryActionText}</button>
                            )}
                            {secondaryActionText.length > 0 && (
                                <button class={cn(styles.btn, styles.secondary)} onClick={handleSecondaryClick}>{secondaryActionText}</button>
                            )}
                        </div>
                    )}
                </div>
                {messageType === 'big_single_action' && primaryActionText && primaryAction && (
                    <button class={cn(styles.btn)} onClick={handlePrimaryClick}>{primaryActionText}</button>
                )}
            </div>
        </>
    )
}
