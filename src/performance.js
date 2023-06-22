/**
 * Performance monitor, holds reference to PerformanceMark instances.
 */
export class PerformanceMonitor {
    constructor () {
        this.marks = []
    }

    /**
     * Create performance marker
     * @param {string} name
     * @returns {PerformanceMark}
     */
    mark (name) {
        const mark = new PerformanceMark(name)
        this.marks.push(mark)
        return mark
    }

    /**
     * Measure all performance markers
     */
    measureAll () {
        return this.marks.map((mark) => {
            return mark.measure()
        })
    }

    totalDuration () {
        return this.measureAll().reduce((total, mark) => {
            return total + mark.duration
        }, 0)
    }
}

/**
 * Tiny wrapper around performance.mark and performance.measure
 */
export class PerformanceMark {
    /**
     * @param {string} name
     */
    constructor (name) {
        this.name = name
        performance.mark(this.name + 'Start')
    }

    end () {
        performance.mark(this.name + 'End')
    }

    measure () {
        return performance.measure(this.name, this.name + 'Start', this.name + 'End')
    }
}
