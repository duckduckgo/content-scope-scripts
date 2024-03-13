import ContentFeature from '../content-feature'

export default class WebVitals extends ContentFeature {
    init () {
        this.messaging.subscribe('getVitals', () => {
            const paintResources = performance.getEntriesByType('paint')
            const firstPaint = paintResources.find((entry) => entry.name === 'first-contentful-paint')
            this.messaging.notify('vitalsResult', { vitals: [firstPaint?.startTime] })
        })
    }
}
