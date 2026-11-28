import WebDetection from '../../src/features/web-detection.js';
import { createInstance, expectParseError, inTopFrame, testGlobal } from './support.js';

/**
 * An `IntersectionObserver` or `ResizeObserver` the tests deliver entries to.
 */
class FakeGeometryObserver {
    /** @type {FakeGeometryObserver[]} */
    static instances = [];

    /**
     * @param {(entries: unknown[]) => void} callback
     * @param {unknown} [init] - the `IntersectionObserver` options
     */
    constructor(callback, init) {
        this.callback = callback;
        this.init = init;
        /** @type {unknown} */
        this.target = undefined;
        /** @type {unknown} */
        this.options = undefined;
        this.disconnected = false;
        FakeGeometryObserver.instances.push(this);
    }

    /**
     * @param {unknown} target
     * @param {unknown} [options] - the `ResizeObserver.observe()` options
     */
    observe(target, options) {
        if (typeof target !== 'object' || target === null) throw new TypeError('not an element');
        this.target = target;
        this.options = options;
    }

    disconnect() {
        this.disconnected = true;
    }

    /** @param {unknown[]} entries */
    deliver(entries) {
        if (!this.disconnected) this.callback(entries);
    }
}

describe("Waits on an element's place and size", () => {
    inTopFrame();

    /** @type {Array<{ type: string, listener: (event: unknown) => void }>} */
    let listeners;
    /** @type {Record<string, unknown>} */
    let originals;

    beforeEach(() => {
        listeners = [];
        FakeGeometryObserver.instances = [];
        originals = { IntersectionObserver: testGlobal.IntersectionObserver, ResizeObserver: testGlobal.ResizeObserver };
        testGlobal.IntersectionObserver = class extends FakeGeometryObserver {};
        testGlobal.ResizeObserver = class extends FakeGeometryObserver {};
        testGlobal.wdRegion = { id: 'region' };
        spyOn(EventTarget.prototype, 'addEventListener').and.callFake(function (type, listener) {
            listeners.push({ type, listener: /** @type {any} */ (listener) });
        });
        spyOn(EventTarget.prototype, 'removeEventListener');
        spyOn(WebDetection.prototype, 'callFeatureMethod').and.resolveTo(undefined);
        jasmine.clock().install();
    });

    afterEach(() => {
        jasmine.clock().uninstall();
        Object.assign(testGlobal, originals);
        delete testGlobal.wdRegion;
    });

    const click = () => {
        for (const entry of listeners.filter((l) => l.type === 'click')) entry.listener({ isTrusted: true, type: 'click', timeStamp: 1 });
    };

    /**
     * @param {WebDetection} instance
     * @returns {Array<{ type: string, data?: Record<string, unknown> }>}
     */
    function sent(instance) {
        return /** @type {jasmine.Spy} */ (instance.callFeatureMethod).calls
            .allArgs()
            .filter((args) => args[0] === 'webEvents')
            .map((args) => args[2]);
    }

    /**
     * A detector that waits, from a click, with this body, and sends what it gave.
     *
     * @param {Record<string, unknown>} wait
     * @param {unknown} sentValue
     */
    const waiting = (wait, sentValue) =>
        createInstance({
            g: {
                d: {
                    triggers: {
                        breakageReport: { state: 'disabled' },
                        observe: { state: 'enabled', on: [{ event: 'click', sync: true, whenBusy: 'skip' }] },
                    },
                    actions: [
                        { define: { got: { wait: { target: { api: 'wdRegion' }, timeoutMs: 1000, ...wait } } } },
                        { fireEvent: { type: 'got', data: { v: { value: sentValue } } } },
                    ],
                },
            },
        });

    it("observe an element's place in the viewport, with the viewport as root", () => {
        const instance = waiting(
            { intersection: { threshold: [0, 1], root: 'ignored', rootMargin: '10px' }, where: { isIntersecting: false } },
            { ref: 'got', using: 'timeStamp' },
        );
        click();
        const [observer] = FakeGeometryObserver.instances;
        expect(observer.init).toEqual({ threshold: [0, 1] });
        expect(observer.target).toBe(testGlobal.wdRegion);
        observer.deliver([{ isIntersecting: true, time: 5 }]);
        expect(sent(instance)).toEqual([]);
        observer.deliver([{ isIntersecting: false, time: 9 }]);
        expect(sent(instance)).toEqual([{ type: 'got', data: { v: 9 } }]);
        expect(observer.disconnected).toBe(true);
    });

    it("observe an element's size, with the options of `observe()`", () => {
        const instance = waiting(
            { resize: { box: 'border-box' }, where: { 'contentRect.height': { lt: 1 } } },
            { ref: 'got', using: 'contentRect.height' },
        );
        click();
        const [observer] = FakeGeometryObserver.instances;
        expect(observer.options).toEqual({ box: 'border-box' });
        observer.deliver([{ contentRect: { height: 0 } }]);
        expect(sent(instance)).toEqual([{ type: 'got', data: { v: 0 } }]);
    });

    for (const kind of ['intersection', 'resize']) {
        it(`fail at \`target\` straight away when it isn't an element, for \`${kind}\``, () => {
            delete testGlobal.wdRegion;
            const instance = waiting({ [kind]: {} }, { ref: 'got' });
            click();
            expect(sent(instance)).toEqual([]);
            expect(instance.getBreakageReportData()).toEqual([
                { detectorId: 'g.d', errors: { 'actions.0.define.got.wait.target.api': 'aborted' } },
            ]);
        });
    }

    it('resume at `timeoutMs` with no item on an engine without the observer', () => {
        testGlobal.ResizeObserver = undefined;
        const instance = waiting({ resize: {} }, { ref: 'got', is: { type: 'undefined' } });
        click();
        jasmine.clock().tick(1000);
        expect(sent(instance)).toEqual([{ type: 'got', data: { v: true } }]);
    });

    it('need a `target`, and take an object of options', () => {
        expectParseError({ actions: { define: { x: { wait: { intersection: {}, timeoutMs: 1 } } } } }, 'needs `target`');
        expectParseError(
            { actions: { define: { x: { wait: { resize: true, target: { api: 'x' }, timeoutMs: 1 } } } } },
            'takes the options',
        );
        expectParseError(
            { actions: { define: { x: { wait: { resize: {}, intersection: {}, target: { api: 'x' }, timeoutMs: 1 } } } } },
            'a body names one of',
        );
    });
});
