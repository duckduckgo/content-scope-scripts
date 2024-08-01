import ContentFeature from '../content-feature'

export default class BreakageReporting extends ContentFeature {
    init () {
        this.messaging.subscribe('getBreakageReportValues', () => {
            const paintResources = performance.getEntriesByType('paint')
            const firstPaint = paintResources.find((entry) => entry.name === 'first-contentful-paint')
            const firstPaintStart = firstPaint ? firstPaint.startTime : -1.0

            const referrer = document.referrer
            this.messaging.notify('breakageReportResult', {
                firstPaintStart,
                referrer
            })
        })
    }
}
