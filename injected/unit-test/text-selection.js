import { JSDOM } from 'jsdom';
import TextSelection from '../src/features/text-selection.js';

describe('TextSelection', () => {
    let dom;
    let feature;
    let originalWindow;
    let originalDocument;

    beforeEach(() => {
        originalWindow = globalThis.window;
        originalDocument = globalThis.document;
        dom = new JSDOM('<!DOCTYPE html><p id="target">Selected text</p>', { url: 'https://example.com' });
        globalThis.window = dom.window;
        globalThis.document = dom.window.document;

        feature = new TextSelection(
            'textSelection',
            {},
            {},
            {
                platform: { name: 'ios' },
                site: { domain: 'example.com', url: 'https://example.com' },
            },
        );
        feature.notify = jasmine.createSpy('notify');
    });

    afterEach(() => {
        dom.window.close();
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
    });

    function selectTargetText() {
        const target = document.getElementById('target');
        const selection = window.getSelection();
        if (!target || !selection) throw new Error('Missing selection test fixture');
        const range = document.createRange();
        range.selectNodeContents(target);
        selection.removeAllRanges();
        selection.addRange(range);
        const event = new window.Event('selectionchange');
        document.dispatchEvent(event);
        return event;
    }

    function selectionFrame() {
        return /** @type {{readSelection: () => {eventTimestamp: number, selectedText: string}} | undefined} */ (
            /** @type {any} */ (window).__ddgSelectionFrame
        );
    }

    it('installs the reader when initialized', () => {
        feature.init();

        expect(selectionFrame()).toBeDefined();
    });

    it('reports selection state without sending selected text', () => {
        feature.init();

        selectTargetText();

        const [method, params] = feature.notify.calls.mostRecent().args;
        expect(method).toBe('selectionFrameChanged');
        expect(params.hasSelection).toBeTrue();
        expect(params.eventTimestamp).toEqual(jasmine.any(Number));
        expect(params.selectedText).toBeUndefined();
    });

    it('does not report an initial empty selection', () => {
        feature.init();

        expect(feature.notify).not.toHaveBeenCalled();
    });

    it('reports the selection event time against the frame time origin', () => {
        feature.init();
        feature.notify.calls.reset();

        const event = selectTargetText();

        const [, params] = feature.notify.calls.mostRecent().args;
        expect(params.eventTimestamp).toBe(window.performance.timeOrigin + event.timeStamp);
        expect(selectionFrame()?.readSelection().eventTimestamp).toBe(params.eventTimestamp);
    });

    it('reasserts an accepted selection when another frame may have taken native ownership', () => {
        feature.init();
        feature.notify.calls.reset();
        spyOn(feature, '_selectionText').and.returnValue('Same selection');
        const snapshots = [];
        feature.notify.and.callFake((method) => {
            if (method === 'selectionFrameChanged') snapshots.push(selectionFrame()?.readSelection().selectedText);
        });

        document.dispatchEvent(new window.Event('selectionchange'));
        document.dispatchEvent(new window.Event('selectionchange'));

        const notifications = feature.notify.calls.allArgs().filter(([method]) => method === 'selectionFrameChanged');
        expect(notifications).toHaveSize(2);
        for (const [, params] of notifications) {
            expect(params).toEqual({
                hasSelection: true,
                eventTimestamp: jasmine.any(Number),
            });
        }
        expect(snapshots).toEqual(['Same selection', 'Same selection']);
    });

    it('returns the snapshot and its event timestamp when native reads the selected frame', () => {
        feature.init();

        selectTargetText();

        const result = selectionFrame()?.readSelection();
        expect(result?.selectedText).toBe('Selected text');
        expect(result?.eventTimestamp).toEqual(jasmine.any(Number));
    });

    it('keeps the selected-time snapshot when the page mutates the text', () => {
        feature.init();
        selectTargetText();

        const target = document.getElementById('target');
        if (!target) throw new Error('Missing selection test fixture');
        target.textContent = 'Replacement text';

        expect(selectionFrame()?.readSelection().selectedText).toBe('Selected text');
    });

    it('releases a claimed frame when the page is hidden', () => {
        feature.init();
        selectTargetText();

        window.dispatchEvent(new window.Event('pagehide'));

        const [method, params] = feature.notify.calls.mostRecent().args;
        expect(method).toBe('selectionFrameChanged');
        expect(params.hasSelection).toBeFalse();
        expect(selectionFrame()?.readSelection().selectedText).toBe('');
    });

    describe('deferred iframe claims', () => {
        let originalSetTimeout;
        let originalClearTimeout;

        beforeEach(() => {
            jasmine.clock().install();
            originalSetTimeout = window.setTimeout;
            originalClearTimeout = window.clearTimeout;
            window.setTimeout = globalThis.setTimeout;
            window.clearTimeout = globalThis.clearTimeout;
        });

        afterEach(() => {
            window.setTimeout = originalSetTimeout;
            window.clearTimeout = originalClearTimeout;
            jasmine.clock().uninstall();
        });

        it('claims after focus becomes observable on the next task', () => {
            feature.init();
            feature.notify.calls.reset();
            let canClaim = false;
            let selectedText = 'Initial selection';
            spyOn(feature, '_canClaim').and.callFake(() => canClaim);
            spyOn(feature, '_selectionText').and.callFake(() => selectedText);

            document.dispatchEvent(new window.Event('selectionchange'));
            canClaim = true;
            selectedText = 'Focused selection';
            jasmine.clock().tick(0);

            expect(feature.notify).toHaveBeenCalledWith('selectionFrameChanged', jasmine.objectContaining({ hasSelection: true }));
            expect(selectionFrame()?.readSelection().selectedText).toBe('Focused selection');
        });

        it('does not claim when a newer empty selection cancels the retry', () => {
            feature.init();
            feature.notify.calls.reset();
            let canClaim = false;
            let selectedText = 'Selected text';
            spyOn(feature, '_canClaim').and.callFake(() => canClaim);
            spyOn(feature, '_selectionText').and.callFake(() => selectedText);

            document.dispatchEvent(new window.Event('selectionchange'));
            selectedText = '';
            document.dispatchEvent(new window.Event('selectionchange'));
            canClaim = true;
            jasmine.clock().tick(100);

            const claimed = feature.notify.calls
                .allArgs()
                .some(([method, params]) => method === 'selectionFrameChanged' && params.hasSelection === true);
            expect(claimed).toBeFalse();
        });

        it('does not include selected text in a successful retry notification', () => {
            feature.init();
            feature.notify.calls.reset();
            let canClaim = false;
            spyOn(feature, '_canClaim').and.callFake(() => canClaim);
            spyOn(feature, '_selectionText').and.returnValue('Selected text');

            document.dispatchEvent(new window.Event('selectionchange'));
            canClaim = true;
            jasmine.clock().tick(0);

            const [method, params] = feature.notify.calls.mostRecent().args;
            expect(method).toBe('selectionFrameChanged');
            expect(params).toEqual({
                hasSelection: true,
                eventTimestamp: jasmine.any(Number),
            });
        });

        it('cancels a pending claim when the page is hidden', () => {
            feature.init();
            feature.notify.calls.reset();
            let canClaim = false;
            spyOn(feature, '_canClaim').and.callFake(() => canClaim);
            spyOn(feature, '_selectionText').and.returnValue('Selected text');

            document.dispatchEvent(new window.Event('selectionchange'));
            window.dispatchEvent(new window.Event('pagehide'));
            canClaim = true;
            jasmine.clock().tick(0);

            const claimed = feature.notify.calls
                .allArgs()
                .some(([method, params]) => method === 'selectionFrameChanged' && params.hasSelection === true);
            expect(claimed).toBeFalse();
        });
    });
});
