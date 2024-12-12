import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { MessageBar } from '../../components/MessageBar';
import { RMFContext } from '../RMFProvider.js';

/**
 * @import { RMFMessage } from "../../../types/new-tab"
 * @param {object} props
 * @param {RMFMessage} props.message
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} [props.primaryAction]
 * @param {(id: string) => void} [props.secondaryAction]
 */

export function RemoteMessagingFramework({ message, primaryAction, secondaryAction, dismiss }) {
    return <MessageBar message={message} primaryAction={primaryAction} secondaryAction={secondaryAction} dismiss={dismiss} />;
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
