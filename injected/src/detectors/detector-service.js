/**
 * Detector Service
 *
 * Central registry and caching layer for interference detectors.
 * Provides a simple API for registering detectors and retrieving their data.
 */

const registrations = new Map();
const cache = new Map();

/**
 * @typedef {Object} DetectorRegistration
 * @property {() => Promise<any>} getData - Function to get current detector data
 * @property {() => Promise<any>} [refresh] - Optional function to refresh/re-run detection
 */

/**
 * @typedef {Object} CachedSnapshot
 * @property {any} data - The cached detector data
 * @property {number} ts - Timestamp when data was cached
 */

/**
 * Register a detector with the service
 * @param {string} detectorId - Unique identifier for the detector
 * @param {DetectorRegistration} registration - Detector registration object
 */
export function registerDetector(detectorId, registration) {
    registrations.set(detectorId, registration);
}

/**
 * Unregister a detector from the service
 * @param {string} detectorId - Unique identifier for the detector
 */
export function unregisterDetector(detectorId) {
    const registration = registrations.get(detectorId);
    registration?.teardown?.();
    registrations.delete(detectorId);
    cache.delete(detectorId);
}

/**
 * Reset all detectors and clear cache
 * @param {string} [reason] - Optional reason for reset
 */
export function resetDetectors(reason = 'manual') {
    for (const registration of registrations.values()) {
        registration.teardown?.(reason);
    }
    cache.clear();
}

/**
 * Get data from a specific detector
 * @param {string} detectorId - Unique identifier for the detector
 * @param {Object} [options] - Options for data retrieval
 * @param {number} [options.maxAgeMs] - Maximum age of cached data in milliseconds
 * @returns {Promise<any>} Detector data or null if not registered
 */
export async function getDetectorData(detectorId, options = {}) {
    const { maxAgeMs } = options;
    const cached = /** @type {CachedSnapshot | undefined} */ (cache.get(detectorId));

    if (cached) {
        const age = Date.now() - cached.ts;
        if (!maxAgeMs || age <= maxAgeMs) {
            return cached.data;
        }
    }

    const registration = registrations.get(detectorId);
    if (!registration) {
        return null;
    }

    const runner = registration.refresh ?? registration.getData;
    try {
        const data = await runner();
        cache.set(detectorId, { data, ts: Date.now() });
        return data;
    } catch (error) {
        console.error(`[detectorService] Failed to fetch data for ${detectorId}`, error);
        return null;
    }
}

/**
 * Get data from multiple detectors in a single call
 * @param {string[]} detectorIds - Array of detector IDs
 * @param {Object} [options] - Options for data retrieval
 * @param {number} [options.maxAgeMs] - Maximum age of cached data in milliseconds
 * @returns {Promise<Record<string, any>>} Object mapping detector IDs to their data
 */
export async function getDetectorBatch(detectorIds, options = {}) {
    const results = {};
    for (const detectorId of detectorIds) {
        results[detectorId] = await getDetectorData(detectorId, options);
    }
    return results;
}
