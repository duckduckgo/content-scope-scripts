import { JSDOM } from 'jsdom';
import { isUserAssistComplete, waitForUserAssist } from '../src/features/broker-protection/actions/user-assist.js';

describe('waitForUserAssist', () => {
    /**
     * @param {{ completeAfterChecks: number, handOffAfterMs: number, signal?: AbortSignal }} options
     */
    async function run({ completeAfterChecks, handOffAfterMs, signal = new AbortController().signal }) {
        let checks = 0;
        const onHandOff = jasmine.createSpy('onHandOff');
        const completed = await waitForUserAssist({
            isComplete: () => ++checks > completeAfterChecks,
            handOffAfterMs,
            onHandOff,
            signal,
            pollMs: 5,
        });
        return { completed, checks, onHandOff };
    }

    it('completes without handing off when the first check passes', async () => {
        const { completed, checks, onHandOff } = await run({ completeAfterChecks: 0, handOffAfterMs: 0 });
        expect(completed).toBe(true);
        expect(checks).toBe(1);
        expect(onHandOff).not.toHaveBeenCalled();
    });

    it('hands off once, straight after the first failed check, when handOffAfterMs is 0', async () => {
        const { completed, onHandOff } = await run({ completeAfterChecks: 5, handOffAfterMs: 0 });
        expect(completed).toBe(true);
        expect(onHandOff).toHaveBeenCalledTimes(1);
    });

    it('does not hand off if it completes before handOffAfterMs', async () => {
        const { completed, onHandOff } = await run({ completeAfterChecks: 3, handOffAfterMs: 10_000 });
        expect(completed).toBe(true);
        expect(onHandOff).not.toHaveBeenCalled();
    });

    it('stops when aborted', async () => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 20);
        const { completed } = await run({ completeAfterChecks: Infinity, handOffAfterMs: 0, signal: controller.signal });
        expect(completed).toBe(false);
    });
});

describe('isUserAssistComplete', () => {
    /** @type {Document} */
    let doc;
    /** @type {jasmine.Spy} */
    let scrollIntoView;

    beforeEach(() => {
        const dom = new JSDOM('<div id="form"><input id="token" value="x"></div>');
        doc = dom.window.document;
        scrollIntoView = jasmine.createSpy('scrollIntoView');
        dom.window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    });

    it("checks that an element item's parent exists without scrolling it into view", () => {
        const passes = (/** @type {string} */ parent) =>
            isUserAssistComplete({ id: 'ua', completeWhen: [{ type: 'element', selector: '#token', parent }] }, doc);
        expect(passes('#form')).toBe(true);
        expect(passes('#missing')).toBe(false);
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});
