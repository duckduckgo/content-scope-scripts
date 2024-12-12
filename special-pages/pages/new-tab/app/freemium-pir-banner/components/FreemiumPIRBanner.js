import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { MessageBar } from '../../components/MessageBar';
import { FreemiumPIRBannerContext } from '../FreemiumPIRBannerProvider.js';

/**
 * @typedef { import('../../components/MessageBar').MessageBarMessage} MessageBarMessage
 * @typedef { import("../../../types/new-tab").FreemiumPIRBannerMessage} FreemiumPIRBannerMessage
 * @param {object} props
 * @param {FreemiumPIRBannerMessage} props.message
 * @param {(id: string) => void} props.dismiss
 * @param {(id: string) => void} [props.action]
 */

export function FreemiumPIRBanner({ message, action, dismiss }) {
    /** @type {MessageBarMessage} msgBarMessage */
    const msgBarMessage = {
        id: message?.id ? message.id : '',
        messageType: message?.messageType ? message.messageType : 'big_single_action',
        icon: 'Information-Remover-96',
        titleText: message?.titleText ? message.titleText : undefined,
        descriptionText: message?.descriptionText ? message.descriptionText : '',
        primaryActionText: message?.actionText,
    };

    return <MessageBar message={msgBarMessage} primaryAction={action} dismiss={dismiss} />;
}

export function FreemiumPIRBannerConsumer() {
    const { state, action, dismiss } = useContext(FreemiumPIRBannerContext);

    // `state.data.content` can be empty - meaning there's no message to display!
    if (state.status === 'ready' && state.data?.content) {
        return <FreemiumPIRBanner message={state.data.content} action={action} dismiss={dismiss} />;
    }
    return null;
}
