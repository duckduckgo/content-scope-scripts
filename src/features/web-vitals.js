import ContentFeature from "../content-feature";

export default class WebVitals extends ContentFeature {
    init() {
        console.log('VITALS ALIVE')
        this.messaging.subscribe('getVitals', async (/** @type {any} */params) => {
            console.log('MESSAGE RECEIVED')
            const paintResources = performance.getEntriesByType("paint");
            const firstPaint = paintResources.find((entry) => entry.name === 'first-contentful-paint');
            this.messaging.notify('vitalsResult', { 'vitals': [firstPaint?.startTime] })
        })
    }
}
