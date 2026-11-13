import { JSDOM } from 'jsdom';
import { userAssist } from '../src/features/broker-protection/actions/user-assist.js';

describe('userAssist', () => {
    /** @type {Document} */
    let doc;
    /** @type {jasmine.Spy} */
    let onHandOff;

    beforeEach(() => {
        jasmine.clock().install();
        jasmine.clock().mockDate();
        doc = new JSDOM('<form id="form"><input id="token"></form>').window.document;
        onHandOff = jasmine.createSpy('onHandOff');
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    /**
     * @param {Partial<import('../src/features/broker-protection/types.js').UserAssistAction>} [overrides]
     * @returns {import('../src/features/broker-protection/types.js').UserAssistAction}
     */
    function action(overrides) {
        return { id: 'ua', actionType: 'userAssist', completeWhen: [{ type: 'element', selector: '#token[value]' }], ...overrides };
    }

    function solve() {
        doc.getElementById('token')?.setAttribute('value', 'x');
    }

    it('completes without handing off when completeWhen already passes', async () => {
        solve();
        const response = await userAssist(action(), doc, onHandOff);
        expect('success' in response).toBe(true);
        expect(onHandOff).not.toHaveBeenCalled();
    });

    it('hands off once, then completes when completeWhen passes', async () => {
        const pending = userAssist(action(), doc, onHandOff);
        solve();
        jasmine.clock().tick(250);
        const response = await pending;
        expect('success' in response).toBe(true);
        expect(onHandOff).toHaveBeenCalledOnceWith('ua');
    });

    it('does not hand off before handOffAfterMs', async () => {
        const pending = userAssist(action({ handOffAfterMs: 10_000 }), doc, onHandOff);
        solve();
        jasmine.clock().tick(250);
        await pending;
        expect(onHandOff).not.toHaveBeenCalled();
    });
});
