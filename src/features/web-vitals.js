import ContentFeature from "../content-feature";
import { onLCP, onFID, onCLS } from 'web-vitals';

export default class WebVitals extends ContentFeature {
    init() {
        this.messaging.subscribe('getVitals', async (/** @type {any} */params) => {
            this.messaging.notify('vitalsResult', { 'vitals': [this.lcp, this.fid, this.cls] })
        })

        onLCP(metric => {
            this.lcp = metric.value
        })
        onFID(metric => {
            this.fid = metric.value
        })
        onCLS(metric => {
            this.cls = metric.value
        })
    }
}
