/**
 * @typedef {object} DetectorRegistration
 * @property {() => any | Promise<any>} getData
 * @property {(() => any | Promise<any>)=} refresh
 * @property {(() => void)=} teardown
 *
 * @typedef {object} CachedSnapshot
 * @property {any} data
 * @property {number} ts
 */

const registrations = new Map();
const cache = new Map();

/**
 * Register a detector with the shared service.
 * Subsequent calls replace the previous registration for the same id.
 * @param {string} detectorId
 * @param {DetectorRegistration} registration
 */
export function registerDetector(detectorId, registration) {
    registrations.set(detectorId, registration);
}

/**
 * Remove a detector registration and drop any cached data.
 * @param {string} detectorId
 */
export function unregisterDetector(detectorId) {
    const registration = registrations.get(detectorId);
    registration?.teardown?.();
    registrations.delete(detectorId);
    cache.delete(detectorId);
}

/**
 * Reset all detector caches and invoke teardowns.
 * @param {string} [reason]
 */
export function resetDetectors(reason = 'manual') {
    for (const registration of registrations.values()) {
        registration.teardown?.(reason);
    }
    cache.clear();
}

/**
 * Fetch detector data. Uses cached value when available unless maxAgeMs is exceeded.
 * @param {string} detectorId
 * @param {{ maxAgeMs?: number }} [options]
 * @returns {Promise<any|null>}
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
 * Convenience helper for fetching multiple detectors at once.
 * @param {string[]} detectorIds
 * @param {{ maxAgeMs?: number }} [options]
 * @returns {Promise<Record<string, any|null>>}
 */
export async function getDetectorBatch(detectorIds, options = {}) {
    const results = {};
    for (const detectorId of detectorIds) {
        results[detectorId] = await getDetectorData(detectorId, options);
    }
    return results;
}

