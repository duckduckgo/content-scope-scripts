import cn from 'classnames';
import { h } from 'preact';
import { Button } from '../../../../../shared/components/Button/Button';
import { DismissButton } from '../../components/DismissButton';
import styles from './FreemiumPIRBanner.module.css';
import { FreemiumPIRBannerContext } from '../FreemiumPIRBannerProvider';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { convertMarkdownToHTMLForStrongTags } from '../../../../../shared/utils';
import { useMessaging } from '../../types.js';
import { useWidgetId } from '../../widget-list/widget-config.provider.js';

/**
 * @typedef { import("../../../types/new-tab").FreemiumPIRBannerMessage} FreemiumPIRBannerMessage
 * @param {object} props
 * @param {FreemiumPIRBannerMessage} props.message
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} props.action
 */

export function FreemiumPIRBanner({ message, action, dismiss }) {
    const processedMessageDescription = convertMarkdownToHTMLForStrongTags(message.descriptionText);
    return (
        <div id={message.id} class={cn(styles.root, styles.icon)}>
            <span class={styles.iconBlock}>
                <img src={`./icons/PIR-96.svg`} alt="" />
            </span>
            <div class={styles.content}>
                {message.titleText && <h2 class={styles.title}>{message.titleText}</h2>}
                <p class={styles.description} dangerouslySetInnerHTML={{ __html: processedMessageDescription }} />
            </div>
            {message.messageType === 'big_single_action' && message?.actionText && action && (
                <div class={styles.btnBlock}>
                    <Button variant="standard" onClick={() => action(message.id)}>
                        {message.actionText}
                    </Button>
                </div>
            )}
            {message.id && dismiss && <DismissButton className={styles.dismissBtn} onClick={() => dismiss(message.id)} />}
        </div>
    );
}

export function FreemiumPIRBannerConsumer() {
    const { state, action, dismiss } = useContext(FreemiumPIRBannerContext);
    const messaging = useMessaging();
    const { widgetId } = useWidgetId();
    const didNotifyRef = useRef(false);

    // Notify native when freemiumPIRBanner widget is ready
    useEffect(() => {
        if (state.status === 'ready' && !didNotifyRef.current) {
            didNotifyRef.current = true;
            requestAnimationFrame(() => {
                messaging.widgetDidRender({ id: widgetId });
            });
        }
    }, [state.status, messaging, widgetId]);

    if (state.status === 'ready' && state.data.content) {
        return <FreemiumPIRBanner message={state.data.content} action={action} dismiss={dismiss} />;
    }
    return null;
}
