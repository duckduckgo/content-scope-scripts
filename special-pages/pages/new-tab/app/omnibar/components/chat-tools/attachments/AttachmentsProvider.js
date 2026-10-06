import { createContext, h } from 'preact';
import { useContext } from 'preact/hooks';
import { OmnibarContext } from '../../OmnibarProvider';
import { useSelectedModel } from '../../useSelectedModel';
import { useFileAttachments } from '../file-attachment/useFileAttachments';
import { useImageAttachments } from '../image-attachment/useImageAttachments';

/**
 * @typedef {{
 *   imageState: ReturnType<typeof useImageAttachments>,
 *   fileState: ReturnType<typeof useFileAttachments>,
 *   tabId: string|null|undefined,
 * }} AttachmentsContextValue
 */

/** @type {import('preact').Context<AttachmentsContextValue|null>} */
const AttachmentsContext = createContext(null);

/**
 * @param {object} props
 * @param {string|null|undefined} props.tabId
 * @param {import('preact').ComponentChildren} props.children
 */
export function AttachmentsProvider({ tabId, children }) {
    const { state } = useContext(OmnibarContext);
    const { selectedModel } = useSelectedModel();
    const attachmentLimits = state.config?.attachmentLimits;
    const imageState = useImageAttachments({ tabId, maxImages: attachmentLimits?.images?.maxPerTurn });
    const fileState = useFileAttachments({
        supportedFileTypes: selectedModel?.supportedFileTypes,
        tabId,
        maxFiles: attachmentLimits?.files?.maxPerConversation,
        maxFileSizeMB: attachmentLimits?.files?.maxFileSizeMB,
    });

    return <AttachmentsContext.Provider value={{ imageState, fileState, tabId }}>{children}</AttachmentsContext.Provider>;
}

export function useAttachmentsContext() {
    const context = useContext(AttachmentsContext);
    if (!context) {
        throw new Error('useAttachmentsContext must be used within an AttachmentsProvider');
    }
    return context;
}
