/**
 * @typedef {import('../types/detection.types.js').InterferenceType} InterferenceType
 * @typedef {import('../types/detection.types.js').TypeDetectionResult} TypeDetectionResult
 */

/**
 * @param {InterferenceType} type
 * @returns {TypeDetectionResult}
 */
export function createEmptyResult(type) {
    return {
        detected: false,
        interferenceType: type,
        results: [],
        timestamp: Date.now(),
    };
}
