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
});
