import { iterateDataKey, DDGProxy, DDGReflect } from '../utils';
import { getDataKeySync } from '../crypto';
import ContentFeature from '../content-feature';

/**
 * @typedef {object} FingerprintingAudioInitArgs
 * @property {string} sessionKey
 * @property {{domain: string | null}} site
 */

export default class FingerprintingAudio extends ContentFeature {
    /**
     * @param {FingerprintingAudioInitArgs} args
     */
    init(args) {
        const { sessionKey, site } = args;
        const domainKey = site.domain;

        // In place modify array data to remove fingerprinting
        /**
         * @param {Float32Array|Uint8Array} channelData
         * @param {string | null} domainKey
         * @param {string} sessionKey
         * @param {object} thisArg - AudioBuffer or AnalyserNode, used as cache key
         */
        function transformArrayData(channelData, domainKey, sessionKey, thisArg) {
            let { audioKey } = getCachedResponse(thisArg, args);
            if (!audioKey) {
                let cdSum = 0;
                for (const k in channelData) {
                    cdSum += channelData[k] ?? 0;
                }
                // If the buffer is blank, skip adding data
                if (cdSum === 0) {
                    return;
                }
                audioKey = getDataKeySync(sessionKey, domainKey ?? 'null', cdSum);
                setCache(thisArg, args, audioKey);
            }
            iterateDataKey(audioKey, (item, byte) => {
                const itemAudioIndex = item % channelData.length;

                let factor = byte * 0.0000001;
                if (byte ^ 0x1) {
                    factor = 0 - factor;
                }
                channelData[itemAudioIndex] = (channelData[itemAudioIndex] ?? 0) + factor;
            });
        }

        const copyFromChannelProxy = new DDGProxy(this, AudioBuffer.prototype, 'copyFromChannel', {
            /**
             * @param {Function} target
             * @param {AudioBuffer | undefined} thisArg
             * @param {unknown[]} args
             */
            apply(target, thisArg, args) {
                const source = args[0];
                const channelNumber = args[1];
                const startInChannelRaw = args[2];
                if (
                    !thisArg ||
                    !(source instanceof Float32Array || source instanceof Uint8Array) ||
                    typeof channelNumber !== 'number' ||
                    (startInChannelRaw !== undefined && typeof startInChannelRaw !== 'number') ||
                    channelNumber > thisArg.numberOfChannels ||
                    (typeof startInChannelRaw === 'number' ? startInChannelRaw : 0) > thisArg.length
                ) {
                    return DDGReflect.apply(target, thisArg, args);
                }
                const startInChannel = typeof startInChannelRaw === 'number' ? startInChannelRaw : 0;
                try {
                    thisArg
                        .getChannelData(channelNumber)
                        .slice(startInChannel)
                        .forEach((val, index) => {
                            source[index] = val;
                        });
                } catch {
                    return DDGReflect.apply(target, thisArg, args);
                }
            },
        });
        copyFromChannelProxy.overload();

        const cacheExpiry = 60;
        const cacheData = new WeakMap();
        /**
         * @param {object} thisArg
         * @param {unknown} args - init args or proxy args, used for cache key
         * @returns {{ audioKey: string | null }}
         */
        function getCachedResponse(thisArg, args) {
            const data = cacheData.get(thisArg);
            const timeNow = Date.now();
            if (data && data.args === JSON.stringify(args) && data.expires > timeNow) {
                data.expires = timeNow + cacheExpiry;
                cacheData.set(thisArg, data);
                return data;
            }
            return { audioKey: null };
        }

        /**
         * @param {object} thisArg
         * @param {unknown} args - init args or proxy args, used for cache key
         * @param {string} audioKey
         */
        function setCache(thisArg, args, audioKey) {
            cacheData.set(thisArg, { args: JSON.stringify(args), expires: Date.now() + cacheExpiry, audioKey });
        }

        const getChannelDataProxy = new DDGProxy(this, AudioBuffer.prototype, 'getChannelData', {
            /**
             * @param {Function} target
             * @param {AudioBuffer | undefined} thisArg
             * @param {unknown[]} args
             */
            apply(target, thisArg, args) {
                const channelData = DDGReflect.apply(target, thisArg, args);
                if (thisArg && (channelData instanceof Float32Array || channelData instanceof Uint8Array)) {
                    try {
                        transformArrayData(channelData, domainKey, sessionKey, thisArg);
                    } catch {}
                }
                return channelData;
            },
        });
        getChannelDataProxy.overload();

        const audioMethods = ['getByteTimeDomainData', 'getFloatTimeDomainData', 'getByteFrequencyData', 'getFloatFrequencyData'];
        for (const methodName of audioMethods) {
            const proxy = new DDGProxy(this, AnalyserNode.prototype, methodName, {
                /**
                 * @param {Function} target
                 * @param {AnalyserNode | undefined} thisArg
                 * @param {unknown[]} args
                 */
                apply(target, thisArg, args) {
                    DDGReflect.apply(target, thisArg, args);
                    const dest = args[0];
                    if (thisArg && (dest instanceof Float32Array || dest instanceof Uint8Array)) {
                        try {
                            transformArrayData(dest, domainKey, sessionKey, thisArg);
                        } catch {}
                    }
                },
            });
            proxy.overload();
        }
    }
}
