/**
 * @typedef {Object} RecaptchaClientData
 * @property {string} id
 * @property {string} version
 * @property {string} [pageurl]
 * @property {string} [sitekey]
 * @property {string[]|null} [callback]
 * @property {((token: string) => void)|null} [function]
 */

/**
 * @param {object} args
 * @param {string} args.token
 */
export function captchaCallback(args) {
    const clients = findRecaptchaClients(globalThis);

    // if a client was found, check there was a function
    if (clients.length === 0) {
        return console.log('cannot find clients');
    }

    const first = clients[0];
    if (first && typeof first.function === 'function') {
        try {
            first.function(args.token);
            console.log('called function with path', first.callback);
        } catch (e) {
            console.error('could not call function');
        }
    }

    /**
     * Try to find a callback in a path such as ['___grecaptcha_cfg', 'clients', '0', 'U', 'U', 'callback']
     * @param {Record<string, unknown>} target
     * @returns {RecaptchaClientData[]}
     */
    function findRecaptchaClients(target) {
        if (typeof target.___grecaptcha_cfg === 'undefined') {
            console.log('target.___grecaptcha_cfg not found in ', location.href);
            return [];
        }
        const cfg = /** @type {{ clients?: Record<string, Record<string, unknown>> }} */ (target.___grecaptcha_cfg);
        return Object.entries(cfg.clients || {}).map(([cid, client]) => {
            const cidNumber = parseInt(cid, 10);
            /** @type {RecaptchaClientData} */
            const data = {
                id: cid,
                version: cidNumber >= 10000 ? 'V3' : 'V2',
            };
            const objects = /** @type {Array<[string, Record<string, unknown>]>} */ (
                Object.entries(client).filter(([, value]) => value && typeof value === 'object')
            );

            objects.forEach(([toplevelKey, toplevel]) => {
                const found = Object.entries(toplevel).find(
                    ([, value]) => value && typeof value === 'object' && 'sitekey' in value && 'size' in value,
                );

                if (
                    typeof toplevel === 'object' &&
                    typeof HTMLElement !== 'undefined' &&
                    toplevel instanceof HTMLElement &&
                    toplevel.tagName === 'DIV'
                ) {
                    data.pageurl = toplevel.baseURI;
                }

                if (found) {
                    const [sublevelKey, sublevel] = found;
                    const sublevelObj = /** @type {{ sitekey?: string; [key: string]: unknown }} */ (sublevel);

                    data.sitekey = sublevelObj.sitekey;
                    const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
                    const callback = sublevelObj[callbackKey];
                    if (!callback || typeof callback !== 'function') {
                        data.callback = null;
                        data.function = null;
                    } else {
                        data.function = /** @type {(token: string) => void} */ (callback);
                        data.callback = ['___grecaptcha_cfg', 'clients', cid, toplevelKey, sublevelKey, callbackKey];
                    }
                }
            });
            return data;
        });
    }
}
