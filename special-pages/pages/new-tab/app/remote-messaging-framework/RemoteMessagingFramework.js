import { h, Fragment } from 'preact'
import cn from 'classnames'
import styles from './RemoteMessagingFramework.module.css'
import MessageIcons from './MessageIcons'

/**
 *
 * @param {object} props;
 * @param {string} props.id
 * @param {'small'|'medium'|'big_single_action'|'big_two_action'} props.messageType
 * @param {string} props.titleText
 * @param {string} props.descriptionText
 * @param {"Announce"|"DDGAnnounce"|"CriticalUpdate"|"AppUpdate"|"PrivacyPro"} [props.icon]
 * @param {string} [props.primaryActionText]
 * @param {function} [props.primaryAction]
 * @param {string} [props.secondaryActionText]
 * @param {function} [props.secondaryAction]
 */

export function RemoteMessagingFramework({ id, messageType, titleText, descriptionText, icon, primaryActionText = '', primaryAction, secondaryActionText = '', secondaryAction }) {


    return (

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
                            <button class={cn(styles.btn, styles.primary)} onClick={primaryAction}>{primaryActionText}</button>
                        )}
                        {secondaryActionText.length > 0 && (
                            <button class={cn(styles.btn, styles.secondary)} onClick={secondaryAction}>{secondaryActionText}</button>
                        )}
                    </div>
                )}
            </div>
            {messageType === 'big_single_action' && primaryActionText && primaryAction && (
                <button class={cn(styles.btn)} onClick={primaryAction}>{primaryActionText}</button>
            )}
        </div>

    )
}
