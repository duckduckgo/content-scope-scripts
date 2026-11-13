import { performanceNow } from './captured-globals.js';

/**
 * Performance monitor, holds reference to PerformanceMark instances.
 */
export class PerformanceMonitor {
    constructor() {
        /** @type {PerformanceMark[]} */
        this.marks = [];
    }

    /**
     * Create performance marker
     * @param {string} name
     * @returns {PerformanceMark}
     */
    mark(name) {
        const mark = new PerformanceMark(name);
        this.marks.push(mark);
        return mark;
    }

    /**
     * Measure all performance markers
     */
    measureAll() {
        this.marks.forEach((mark) => {
            mark.measure();
        });
    }
}

/**
 * Tiny wrapper around performance.mark and performance.measure
 */
// eslint-disable-next-line no-redeclare
export class PerformanceMark {
    /** @type {number | undefined} */
    endTime;

    /**
     * @param {string} name
     */
    constructor(name) {
        this.name = name;
        this.startTime = performanceNow();
        performance.mark(this.name + 'Start');
    }

    end() {
        this.endTime = performanceNow();
        performance.mark(this.name + 'End');
    }

    /**
     * Record a measure from the start to the end time. It never throws, as callers measure in `finally` blocks.
     * The times are numbers rather than mark names, since the page and other bundles can create marks with the same names.
     */
    measure() {
        if (this.endTime === undefined) return;
        try {
            performance.measure(this.name, { start: this.startTime, end: this.endTime });
        } catch {
            // A page can replace or break `performance.measure`
        }
    }
}
