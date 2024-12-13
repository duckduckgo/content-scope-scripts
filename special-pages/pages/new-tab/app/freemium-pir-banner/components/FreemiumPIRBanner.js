import cn from 'classnames';
import { h } from 'preact';
import { Button } from '../../../../../shared/components/Button/Button';
import { DismissButton } from '../../components/DismissButton';
import styles from './FreemiumPIRBanner.module.css';
import { FreemiumPIRBannerContext } from '../FreemiumPIRBannerProvider';
import { useContext } from 'preact/hooks';

/**
 * @typedef { import("../../../types/new-tab").FreemiumPIRBannerMessage} FreemiumPIRBannerMessage
 * @param {object} props
 * @param {FreemiumPIRBannerMessage} props.message
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function FreemiumPIRBanner({ message, action, dismiss }) {
    const convertMarkdownToHTML = (markdown) => {
        // Use a regular expression to find all the words wrapped in **
        const regex = /\*\*(.*?)\*\*/g;

        // Replace the matched text with the HTML <strong> tags
        const result = markdown.replace(regex, '<strong>$1</strong>');
        return result;
    };

    return (
        <div id={message?.id} class={cn(styles.root, styles.icon)}>
            <span class={styles.iconBlock}>
                <img src={`./icons/Information-Remover-96.svg`} alt="" />
            </span>
            <div class={styles.content}>
                {message?.titleText && <h2 class={styles.title}>{message.titleText}</h2>}
                <p class={styles.description} dangerouslySetInnerHTML={{ __html: convertMarkdownToHTML(message?.descriptionText) }} />
            </div>
            {message?.messageType === 'big_single_action' && message?.actionText && action && (
                <div class={styles.btnBlock}>
                    <Button variant="standard" onClick={() => action(message.id)}>
                        {message.actionText}
                    </Button>
                </div>
            )}
            {message?.id && dismiss && <DismissButton className={styles.dismissBtn} onClick={() => dismiss(message.id)} />}
        </div>
    );
}

export function FreemiumPIRBannerConsumer() {
    const { state, action, dismiss } = useContext(FreemiumPIRBannerContext);

    // `state.data.content` can be empty - meaning there's no message to display!
    if (state.status === 'ready' && state.data.content) {
        return <FreemiumPIRBanner message={state.data.content} action={action} dismiss={dismiss} />;
    }
    return null;
}
