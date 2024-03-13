import ContentFeature from "../content-feature";
import { onLCP, onFID, onCLS } from 'web-vitals';

export default class WebVitals extends ContentFeature {
    init() {
        console.log('VITALS ALIVE')
        this.messaging.subscribe('getVitals', async (/** @type {any} */params) => {
            console.log('MESSAGE RECEIVED')
            this.messaging.notify('vitalsResult', { 'vitals': [this.lcp, this.fid, this.cls] })
        })
    }

    load() {
        // onLCP((metric) => {
        //     console.log(metric)
        //     this.lcp = metric.value
        // }, {reportAllChanges: true})
        // onFID((metric) => {
        //     console.log(metric)
        //     this.fid = metric.value
        // }, {reportAllChanges: true})
        // onCLS((metric) => {
        //     console.log(metric)
        //     this.cls = metric.value
        // }, {reportAllChanges: true})

        onCLS(console.log);
        onFID(console.log);
        onLCP(console.log);
    }
}
