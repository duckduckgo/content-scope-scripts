import ContentFeature from '../content-feature.js';

const MSG_WEB_EVENT = 'webEvent';

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
        if (!this.getFeatureSettingEnabled('state', 'enabled')) return;
        this.messaging.notify(MSG_WEB_EVENT, { type, data });
    }
}

export default WebEvents;
