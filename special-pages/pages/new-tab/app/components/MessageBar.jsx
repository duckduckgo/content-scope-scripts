import { h, Fragment } from 'preact';
import cn from 'classnames';
import styles from './MessageBar.module.css';
import { DismissButton } from './DismissButton';
import { Button } from '../../../../shared/components/Button/Button';
import { usePlatformName } from '../settings.provider';

/** 
 * @typedef {object} MessageBarMessage 
 * @property {string} message.id
 * @property {string} message.messageType
 * @property {string} message.descriptionText
 * @property {string} [message.titleText]
 * @property {string} [message.icon]
 * @property {string} [message.primaryActionText]
 * @property {string} [message.secondaryActionText]
*/

/**
 * @param {object} props
 * @param {MessageBarMessage} props.message
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} [props.primaryAction]
 * @param {(id: string) => void} [props.secondaryAction]
 */

export function MessageBar({ message, primaryAction, secondaryAction, dismiss }) {
    const { id, messageType, descriptionText } = message;
    const platform = usePlatformName();

    return (
        <div id={id} class={cn(styles.root, messageType !== 'small' && message.icon && styles.icon)}>
            {messageType !== 'small' && message.icon && (
                <span class={styles.iconBlock}>
                    <img src={`./icons/${message.icon}.svg`} alt="" />
                </span>
            )}
            <div class={styles.content}>
                {message.titleText && <h2 class={styles.title}>{message.titleText}</h2>}
                <p class={styles.description}>{descriptionText}</p>
                {messageType === 'big_two_action' && (
                    <div class={styles.btnRow}>
                        {platform === 'windows' ? (
                            <Fragment>
                                {primaryAction && message.primaryActionText && (
                                    <Button variant={'accentBrand'} onClick={() => primaryAction(id)}>
                                        {message.primaryActionText}
                                    </Button>
                                )}
                                {secondaryAction && message.secondaryActionText && (
                                    <Button variant={'standard'} onClick={() => secondaryAction(id)}>
                                        {message.secondaryActionText}
                                    </Button>
                                )}
                            </Fragment>
                        ) : (
                            <Fragment>
                                {secondaryAction && message.secondaryActionText && (
                                    <Button variant={'standard'} onClick={() => secondaryAction(id)}>
                                        {message.secondaryActionText}
                                    </Button>
                                )}
                                {primaryAction && message.primaryActionText && (
                                    <Button variant={'accentBrand'} onClick={() => primaryAction(id)}>
                                        {message.primaryActionText}
                                    </Button>
                                )}
                            </Fragment>
                        )}
                    </div>
                )}
            </div>
            {messageType === 'big_single_action' && message.primaryActionText && primaryAction && (
                <div class={styles.btnBlock}>
                    <Button variant="standard" onClick={() => primaryAction(id)}>
                        {message.primaryActionText}
                    </Button>
                </div>
            )}
            <DismissButton className={styles.dismissBtn} onClick={() => dismiss(id)} />
        </div>
    );
}