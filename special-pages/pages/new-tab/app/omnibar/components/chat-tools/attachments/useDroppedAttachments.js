import { routeFiles } from '../tab-attachment/fileChannels';

/**
 * Drag-and-drop intake for the Duck.ai prompt: files dropped on the composer (e.g. from Finder)
 * go through the same image and file pipelines as the picker.
 *
 * @param {object} params
 * @param {((files: File[]) => Promise<unknown>) | null} params.processImages - the image channel, or null when images can't be attached.
 * @param {((files: File[]) => Promise<unknown>) | null} params.processOtherFiles - the file channel (PDFs), or null when files can't be attached.
 * @param {boolean} params.enabled
 */
export function useDroppedAttachments({ processImages, processOtherFiles, enabled }) {
    const acceptsFiles = enabled && (processImages !== null || processOtherFiles !== null);

    /** @param {DragEvent} event */
    const isFileDrag = (event) => acceptsFiles && (event.dataTransfer?.types.includes('Files') ?? false);

    /**
     * Use for both `dragenter` and `dragover`.
     * @param {DragEvent} event
     */
    const handleDragOver = (event) => {
        if (!isFileDrag(event) || !event.dataTransfer) return;
        // Unless the page accepts the drag, the macOS app opens the file in the tab instead of dropping it here.
        // Stopping propagation keeps the page-wide blocker in dropzone.js from resetting dropEffect to 'none'.
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    };

    /** @param {DragEvent} event */
    const handleDrop = async (event) => {
        if (!isFileDrag(event) || !event.dataTransfer) return;
        event.preventDefault();
        try {
            await routeFiles(Array.from(event.dataTransfer.files), processImages, processOtherFiles);
        } catch (err) {
            console.warn('Dropped attachment failed', err);
        }
    };

    return { handleDragOver, handleDrop };
}
