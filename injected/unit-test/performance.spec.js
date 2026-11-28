// eslint-disable-next-line no-redeclare
import { PerformanceMonitor, PerformanceMark } from '../src/performance.js';

describe('PerformanceMonitor', () => {
    it('creates marks and stores them', () => {
        const monitor = new PerformanceMonitor();
        const mark = monitor.mark('testMark');
        expect(mark).toBeInstanceOf(PerformanceMark);
        expect(monitor.marks.length).toBe(1);
    });

    it('measureAll calls measure on all marks', () => {
        const monitor = new PerformanceMonitor();
        const mark1 = monitor.mark('mark1');
        const mark2 = monitor.mark('mark2');
        mark1.end();
        mark2.end();

        // measureAll should not throw
        expect(() => monitor.measureAll()).not.toThrow();
    });
});

describe('PerformanceMark', () => {
    it('creates a start mark on construction', () => {
        const perfMark = new PerformanceMark('test');
        const entries = performance.getEntriesByName('testStart', 'mark');
        expect(entries.length).toBeGreaterThan(0);
        expect(perfMark.name).toBe('test');
    });

    it('creates an end mark on end()', () => {
        const mark = new PerformanceMark('test2');
        mark.end();
        const entries = performance.getEntriesByName('test2End', 'mark');
        expect(entries.length).toBeGreaterThan(0);
    });

    it('measure() creates a measure entry', () => {
        const mark = new PerformanceMark('test3');
        mark.end();
        mark.measure();
        const entries = performance.getEntriesByName('test3', 'measure');
        expect(entries.length).toBeGreaterThan(0);
    });

    it('measure() spans the recorded start and end times', () => {
        const mark = new PerformanceMark('test4');
        mark.end();
        // A later mark with the same name does not move the measure
        performance.mark('test4Start');
        mark.measure();
        const [entry] = performance.getEntriesByName('test4', 'measure');
        expect(entry.startTime).toBe(mark.startTime);
        expect(entry.duration).toBeCloseTo(/** @type {number} */ (mark.endTime) - mark.startTime, 5);
    });

    it('measure() records nothing before end()', () => {
        const mark = new PerformanceMark('test5');
        mark.measure();
        expect(performance.getEntriesByName('test5', 'measure').length).toBe(0);
    });

    it('measure() does not throw when performance.measure throws', () => {
        const mark = new PerformanceMark('test6');
        mark.end();
        spyOn(performance, 'measure').and.throwError('broken');
        expect(() => mark.measure()).not.toThrow();
    });
});
