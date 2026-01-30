import { JSDOM } from 'jsdom';
import { BrowserUiLockController, computeUiLockState } from '../src/features/web-compat.js';

function setupDom() {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { pretendToBeVisual: true });
    const originalGlobals = {
        window: global.window,
        document: global.document,
        Node: global.Node,
        MutationObserver: global.MutationObserver,
        requestAnimationFrame: global.requestAnimationFrame,
    };
    global.window = dom.window;
    global.document = dom.window.document;
    global.Node = dom.window.Node;
    global.MutationObserver = dom.window.MutationObserver;
    global.requestAnimationFrame = dom.window.requestAnimationFrame?.bind(dom.window);

    return {
        dom,
        restore() {
            global.window = originalGlobals.window;
            global.document = originalGlobals.document;
            global.Node = originalGlobals.Node;
            global.MutationObserver = originalGlobals.MutationObserver;
            global.requestAnimationFrame = originalGlobals.requestAnimationFrame;
        },
    };
}

function buildUiLockController(options, notify = () => {}) {
    return new BrowserUiLockController({
        options: {
            useOverscroll: true,
            useOverflow: true,
            includeOverflowClip: false,
            observeMutations: true,
            postLoadDelayMs: 300,
            ...options,
        },
        notify,
        addDebugFlag: () => {},
    });
}

describe('browser-ui-lock', () => {
    it('detects overscroll-behavior and overflow signals', () => {
        const { restore } = setupDom();
        try {
            document.documentElement.style.overscrollBehavior = 'none';
            document.body.style.overflowY = 'hidden';

            const { locked, signals } = computeUiLockState({
                htmlStyle: window.getComputedStyle(document.documentElement),
                bodyStyle: window.getComputedStyle(document.body),
                useOverscroll: true,
                useOverflow: true,
                includeOverflowClip: false,
            });

            expect(locked).toBeTrue();
            expect(signals.overscrollBehavior.matches).toBeTrue();
            expect(signals.overflow.matches).toBeTrue();
        } finally {
            restore();
        }
    });

    it('treats overflow: clip as optional', () => {
        const { restore } = setupDom();
        try {
            document.body.style.overflow = 'clip';

            const withoutClip = computeUiLockState({
                htmlStyle: window.getComputedStyle(document.documentElement),
                bodyStyle: window.getComputedStyle(document.body),
                useOverscroll: false,
                useOverflow: true,
                includeOverflowClip: false,
            });
            const withClip = computeUiLockState({
                htmlStyle: window.getComputedStyle(document.documentElement),
                bodyStyle: window.getComputedStyle(document.body),
                useOverscroll: false,
                useOverflow: true,
                includeOverflowClip: true,
            });

            expect(withoutClip.locked).toBeFalse();
            expect(withClip.locked).toBeTrue();
        } finally {
            restore();
        }
    });

    it('re-evaluates when MutationObserver detects style changes', async () => {
        const { restore } = setupDom();
        try {
            const notifySpy = jasmine.createSpy('notify');

            global.requestAnimationFrame = (callback) => {
                const timestamp = 0;
                callback(timestamp);
                return 1;
            };

            const controller = buildUiLockController(
                {
                    observeMutations: true,
                },
                notifySpy,
            );
            controller.init();

            document.documentElement.style.overscrollBehavior = 'none';
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(notifySpy).toHaveBeenCalledWith(
                'uiLockChanged',
                jasmine.objectContaining({
                    locked: true,
                }),
            );
        } finally {
            restore();
        }
    });

    it('debounces evaluation with requestAnimationFrame', () => {
        const { restore } = setupDom();
        try {
            const callbacks = [];
            global.requestAnimationFrame = (callback) => {
                callbacks.push(callback);
                return callbacks.length;
            };

            class CountingBrowserUiLockController extends BrowserUiLockController {
                evaluationCount = 0;
                evaluateLockState() {
                    this.evaluationCount += 1;
                }
            }

            const controller = new CountingBrowserUiLockController({
                options: {
                    useOverscroll: true,
                    useOverflow: true,
                    includeOverflowClip: false,
                    observeMutations: true,
                    postLoadDelayMs: 300,
                },
                notify: () => {},
                addDebugFlag: () => {},
            });
            controller.scheduleEvaluation();
            controller.scheduleEvaluation();

            expect(callbacks.length).toBe(1);
            callbacks.forEach((callback) => {
                const timestamp = 0;
                callback(timestamp);
            });
            expect(controller.evaluationCount).toBe(1);
        } finally {
            restore();
        }
    });
});
