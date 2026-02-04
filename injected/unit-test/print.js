import { Print } from '../src/features/print.js';

describe('Print feature', () => {
    let mockWindow;
    let mockNotify;

    beforeEach(() => {
        // Create a mock window object with a print function
        mockWindow = {
            print: function originalPrint() {
                return 'original';
            },
        };
        mockNotify = jasmine.createSpy('notify');
    });

    /**
     * Creates a Print feature instance with mocked messaging
     * @returns {Print}
     */
    function createPrintFeature() {
        const feature = new Print('print', {}, {}, {
            site: {
                domain: 'example.com',
                url: 'http://example.com',
            },
        });

        // Mock the notify method
        feature.notify = mockNotify;

        // Mock defineProperty to use Object.defineProperty on our mock window
        feature.defineProperty = (obj, prop, descriptor) => {
            // The feature passes `window` but we redirect to mockWindow
            if (prop === 'print') {
                Object.defineProperty(mockWindow, prop, descriptor);
            } else {
                Object.defineProperty(obj, prop, descriptor);
            }
        };

        return feature;
    }

    /**
     * Creates a Print feature that operates on a given target object
     * @param {object} target - The object to define print on
     * @returns {Print}
     */
    function createPrintFeatureWithTarget(target) {
        const feature = new Print('print', {}, {}, {
            site: {
                domain: 'example.com',
                url: 'http://example.com',
            },
        });

        // Mock the notify method
        feature.notify = mockNotify;

        // Store original defineProperty behavior and redirect to target
        const originalDefineProperty = feature.defineProperty.bind(feature);
        feature.defineProperty = (obj, prop, descriptor) => {
            // Redirect window.print to our target
            Object.defineProperty(target, prop, descriptor);
        };

        return feature;
    }

    it('should override print function on target object', () => {
        const target = { print: () => 'original' };
        const originalPrintRef = target.print;
        const feature = createPrintFeatureWithTarget(target);

        feature.init();

        expect(target.print).not.toBe(originalPrintRef);
        expect(typeof target.print).toBe('function');
    });

    it('should notify native app when print is called', () => {
        const target = { print: () => 'original' };
        const feature = createPrintFeatureWithTarget(target);

        feature.init();
        target.print();

        expect(mockNotify).toHaveBeenCalledWith('print');
        expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('should notify on each call to print', () => {
        const target = { print: () => 'original' };
        const feature = createPrintFeatureWithTarget(target);

        feature.init();
        target.print();
        target.print();
        target.print();

        expect(mockNotify).toHaveBeenCalledTimes(3);
    });

    it('should define print with correct property descriptor', () => {
        const target = { print: () => 'original' };
        const feature = createPrintFeatureWithTarget(target);

        feature.init();

        const descriptor = Object.getOwnPropertyDescriptor(target, 'print');

        expect(descriptor.configurable).toBe(true);
        expect(descriptor.enumerable).toBe(true);
        expect(descriptor.writable).toBe(true);
        expect(typeof descriptor.value).toBe('function');
    });

    it('should allow print to be overwritten after initialization', () => {
        const target = { print: () => 'original' };
        const feature = createPrintFeatureWithTarget(target);

        feature.init();

        const customPrint = () => 'custom';
        target.print = customPrint;

        expect(target.print).toBe(customPrint);
    });

    it('should not call original print function', () => {
        const originalPrintSpy = jasmine.createSpy('originalPrint');
        const target = { print: originalPrintSpy };
        const feature = createPrintFeatureWithTarget(target);

        feature.init();
        target.print();

        // The original print should NOT be called - native handles printing
        expect(originalPrintSpy).not.toHaveBeenCalled();
        // But notify should be called
        expect(mockNotify).toHaveBeenCalledWith('print');
    });

    it('should return undefined when print is called', () => {
        const target = { print: () => 'original' };
        const feature = createPrintFeatureWithTarget(target);

        feature.init();
        const result = target.print();

        expect(result).toBeUndefined();
    });
});
