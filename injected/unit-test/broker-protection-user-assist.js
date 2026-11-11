import { JSDOM } from 'jsdom';
import { userAssist } from '../src/features/broker-protection/actions/user-assist.js';

describe('userAssist', () => {
    /** @type {Document} */
    let doc;
    /** @type {{ start: jasmine.Spy, end: jasmine.Spy }} */
    let handOff;

    beforeEach(() => {
        jasmine.clock().install();
        jasmine.clock().mockDate();
        doc = new JSDOM('<form id="form"><input id="token"></form>').window.document;
        handOff = { start: jasmine.createSpy('start'), end: jasmine.createSpy('end') };
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
        const response = await userAssist(action(), doc, handOff);
        expect('success' in response).toBe(true);
        expect(handOff.start).not.toHaveBeenCalled();
        expect(handOff.end).not.toHaveBeenCalled();
    });

    it('hands off once, then ends the hand-off when completeWhen passes', async () => {
        const pending = userAssist(action({ highlight: '#form' }), doc, handOff);
        solve();
        jasmine.clock().tick(250);
        const response = await pending;
        expect('success' in response).toBe(true);
        expect(handOff.start).toHaveBeenCalledOnceWith('ua', doc.getElementById('form'));
        expect(handOff.end).toHaveBeenCalledTimes(1);
    });

    it('does not hand off before handOffAfterMs', async () => {
        const pending = userAssist(action({ handOffAfterMs: 10_000 }), doc, handOff);
        solve();
        jasmine.clock().tick(250);
        await pending;
        expect(handOff.start).not.toHaveBeenCalled();
    });
});
