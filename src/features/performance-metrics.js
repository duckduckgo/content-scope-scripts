import ContentFeature from '../content-feature'

export default class PerformanceMetrics extends ContentFeature {
    init () {
        this.messaging.subscribe('getVitals', () => {
            const paintResources = performance.getEntriesByType('paint')
            const firstPaint = paintResources.find((entry) => entry.name === 'first-contentful-paint')
            const vitals = firstPaint ? [firstPaint.startTime] : []
            this.messaging.notify('vitalsResult', { vitals })
        })
    }
}
