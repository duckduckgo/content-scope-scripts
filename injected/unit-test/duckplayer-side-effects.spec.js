import { SideEffects } from '../src/features/duckplayer/util.js';

describe('SideEffects', () => {
    it('runs each cleanup once when a cleanup re-enters destroy()', () => {
        const se = new SideEffects();
        let fullscreenRuns = 0;
        let holdRuns = 0;

        se.add('fullscreen', () => () => {
            fullscreenRuns += 1;
        });
        // Mirrors video-overlay's remove(): the hold tears down its own registrations
        // from inside its own cleanup.
        se.add('hold', () => () => {
            holdRuns += 1;
            se.destroy('fullscreen');
            se.destroy('hold');
        });

        se.destroy();

        expect(fullscreenRuns).toBe(1);
        expect(holdRuns).toBe(1);
        expect(se._cleanups.length).toBe(0);
    });

    it('destroys only the named side effect', () => {
        const se = new SideEffects();
        const ran = [];
        se.add('a', () => () => ran.push('a'));
        se.add('b', () => () => ran.push('b'));

        se.destroy('a');

        expect(ran).toEqual(['a']);
        expect(se._cleanups.map((c) => c.name)).toEqual(['b']);
    });
});
