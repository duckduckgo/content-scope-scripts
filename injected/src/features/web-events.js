import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { CustomEvent, dispatchEvent } from '../captured-globals.js';

const MSG_WEB_EVENT = 'webEvent';

/**
 * Debug-only page broadcast: a copy of each web event, dispatched on `window` after it is sent, so
 * test pages can show which events fired. The detail is a JSON string, because primitives cross
 * isolated-world boundaries on all platforms and objects created in an isolated world are not
 * readable by the page on Chromium.
 *
 * INVARIANT: release builds never set the debug flag (`args.debug`) on user pages. Any page script
 * can read this event, and the debug flag is its only gate.
 */
const DEBUG_WEB_EVENT_TYPE = 'webEventDebug';

export class WebEvents extends ContentFeature {
    _exposedMethods = this._declareExposedMethods(['fireEvent']);

    init() {}

    /**
     * Forward a web event to the client via messaging.
     *
     * Other features (e.g. webDetection) call this via:
     * ```js
     * this.callFeatureMethod('webEvents', 'fireEvent', { type: 'adwall' });
     * ```
     *
     * @param {{ type: string, data?: Record<string, unknown> }} event
     */
    fireEvent({ type, data = {} }) {
        this.messaging.notify(MSG_WEB_EVENT, { type, data });
        if (this.isDebug) {
            try {
                dispatchEvent?.(new CustomEvent(DEBUG_WEB_EVENT_TYPE, { detail: JSON.stringify({ type, data }) }));
            } catch {
                // The copy never affects the event sent to the client
            }
        }
    }
}

export default WebEvents;
