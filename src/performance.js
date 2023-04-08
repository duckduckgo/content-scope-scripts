export default class PerformanceMonitor {
    /**
     * Create performance marker
     * @param {string} name
     */
    mark (name) {
        performance.mark(name)
    }

    measure () {
        performance.measure('load', 'loadStart', 'loadEnd')
        performance.measure('init', 'initStart', 'initEnd')
    }
}
