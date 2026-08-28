import { JSDOM } from 'jsdom';
import { ClipboardImpl, ClipboardItemImpl, copyWithExecCommand, pasteWithExecCommand } from '../src/features/web-compat/async-clipboard.js';

/**
 * The shim drives the clipboard through `document.execCommand()`, which JSDOM doesn't
 * implement. These helpers stand in for an engine that supports the commands, so the
 * event plumbing, the scratch element and the fallbacks can all be exercised.
 */

/**
 * @typedef {object} ClipboardHarness
 * @property {JSDOM} dom
 * @property {Map<string, string>} written - what the page handed to the clipboard
 * @property {Map<string, string>} system - what the (fake) system clipboard holds
 * @property {string[]} commands - commands passed to `document.execCommand()`
 * @property {() => void} teardown
 */

/**
 * @param {object} [options]
 * @param {boolean} [options.commandSucceeds] - what `document.execCommand()` returns
 * @param {boolean} [options.withClipboardData] - whether events carry a `clipboardData`
 * @param {boolean} [options.commandThrows] - whether `document.execCommand()` throws
 * @returns {ClipboardHarness}
 */
function setupClipboard(options = {}) {
    const { commandSucceeds = true, withClipboardData = true, commandThrows = false } = options;
    const dom = new JSDOM('<!DOCTYPE html><html><body><input id="page-input" value="page value"></body></html>');

    const originals = {
        window: global.window,
        document: global.document,
        HTMLElement: global.HTMLElement,
    };
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;

    /** @type {Map<string, string>} */
    const written = new Map();
    /** @type {Map<string, string>} */
    const system = new Map();
    /** @type {string[]} */
    const commands = [];

    const clipboardData = {
        /**
         * @param {string} type
         * @param {string} value
         */
        setData(type, value) {
            written.set(type, value);
        },
        /**
         * @param {string} type
         * @returns {string}
         */
        getData(type) {
            return system.get(type) ?? '';
        },
    };

    document.execCommand = (command) => {
        commands.push(command);
        if (commandThrows) throw new Error('command not supported');
        if (!commandSucceeds) return false;

        const target = document.activeElement ?? document.body;
        const event = new dom.window.Event(command, { bubbles: true, cancelable: true });
        if (withClipboardData) {
            Object.defineProperty(event, 'clipboardData', { value: clipboardData });
        }
        target.dispatchEvent(event);

        // Emulate the engine's default action, which the shim relies on when the event
        // carries no `clipboardData`.
        if (!event.defaultPrevented && target instanceof dom.window.HTMLTextAreaElement) {
            const scratch = /** @type {HTMLTextAreaElement} */ (target);
            if (command === 'copy') {
                written.set('text/plain', scratch.value);
            } else if (command === 'paste') {
                scratch.value = system.get('text/plain') ?? '';
            }
        }
        return true;
    };

    return {
        dom,
        written,
        system,
        commands,
        teardown() {
            global.window = originals.window;
            global.document = originals.document;
            global.HTMLElement = originals.HTMLElement;
        },
    };
}

describe('async-clipboard.js', () => {
    describe('copyWithExecCommand', () => {
        it('writes every requested format to the clipboard', () => {
            const harness = setupClipboard();
            try {
                const copied = copyWithExecCommand(
                    new Map([
                        ['text/plain', 'plain value'],
                        ['text/html', '<b>rich value</b>'],
                    ]),
                );
                expect(copied).toBeTrue();
                expect(harness.commands).toEqual(['copy']);
                expect(harness.written.get('text/plain')).toBe('plain value');
                expect(harness.written.get('text/html')).toBe('<b>rich value</b>');
            } finally {
                harness.teardown();
            }
        });

        it('falls back to the default copy when the event carries no clipboardData', () => {
            const harness = setupClipboard({ withClipboardData: false });
            try {
                expect(copyWithExecCommand(new Map([['text/plain', 'plain value']]))).toBeTrue();
                expect(harness.written.get('text/plain')).toBe('plain value');
            } finally {
                harness.teardown();
            }
        });

        it('keeps the synthetic event away from the page', () => {
            const harness = setupClipboard();
            try {
                const pageHandler = jasmine.createSpy('pageHandler');
                document.addEventListener('copy', pageHandler);
                copyWithExecCommand(new Map([['text/plain', 'plain value']]));
                expect(pageHandler).not.toHaveBeenCalled();
            } finally {
                harness.teardown();
            }
        });

        it('removes the scratch element and restores focus', () => {
            const harness = setupClipboard();
            try {
                const input = /** @type {HTMLInputElement} */ (document.getElementById('page-input'));
                input.focus();
                copyWithExecCommand(new Map([['text/plain', 'plain value']]));
                expect(document.querySelectorAll('textarea').length).toBe(0);
                expect(document.activeElement).toBe(input);
            } finally {
                harness.teardown();
            }
        });

        it('reports failure when the command is refused', () => {
            const harness = setupClipboard({ commandSucceeds: false });
            try {
                expect(copyWithExecCommand(new Map([['text/plain', 'plain value']]))).toBeFalse();
            } finally {
                harness.teardown();
            }
        });

        it('reports failure when the command throws', () => {
            const harness = setupClipboard({ commandThrows: true });
            try {
                expect(copyWithExecCommand(new Map([['text/plain', 'plain value']]))).toBeFalse();
                expect(document.querySelectorAll('textarea').length).toBe(0);
            } finally {
                harness.teardown();
            }
        });
    });

    describe('pasteWithExecCommand', () => {
        it('reads every supported format from the clipboard', () => {
            const harness = setupClipboard();
            harness.system.set('text/plain', 'plain value');
            harness.system.set('text/html', '<b>rich value</b>');
            try {
                const data = pasteWithExecCommand();
                expect(harness.commands).toEqual(['paste']);
                expect(data?.get('text/plain')).toBe('plain value');
                expect(data?.get('text/html')).toBe('<b>rich value</b>');
                expect(document.querySelectorAll('textarea').length).toBe(0);
            } finally {
                harness.teardown();
            }
        });

        it('reads the inserted text when the event carries no clipboardData', () => {
            const harness = setupClipboard({ withClipboardData: false });
            harness.system.set('text/plain', 'plain value');
            try {
                expect(pasteWithExecCommand()?.get('text/plain')).toBe('plain value');
            } finally {
                harness.teardown();
            }
        });

        it('returns null when the command is refused', () => {
            const harness = setupClipboard({ commandSucceeds: false });
            try {
                expect(pasteWithExecCommand()).toBeNull();
            } finally {
                harness.teardown();
            }
        });
    });

    describe('ClipboardImpl', () => {
        it('writeText copies plain text', async () => {
            const harness = setupClipboard();
            try {
                await new ClipboardImpl().writeText('hello');
                expect(harness.written.get('text/plain')).toBe('hello');
            } finally {
                harness.teardown();
            }
        });

        it('writeText rejects with NotAllowedError when the command is refused', async () => {
            const harness = setupClipboard({ commandSucceeds: false });
            try {
                await expectAsync(new ClipboardImpl().writeText('hello')).toBeRejectedWithError(DOMException, /not focused/);
            } finally {
                harness.teardown();
            }
        });

        it('readText returns the clipboard text', async () => {
            const harness = setupClipboard();
            harness.system.set('text/plain', 'hello');
            try {
                expect(await new ClipboardImpl().readText()).toBe('hello');
            } finally {
                harness.teardown();
            }
        });

        it('readText rejects with NotAllowedError when the command is refused', async () => {
            const harness = setupClipboard({ commandSucceeds: false });
            try {
                await expectAsync(new ClipboardImpl().readText()).toBeRejectedWithError(DOMException, /permission denied/i);
            } finally {
                harness.teardown();
            }
        });

        it('write copies the supported formats of a ClipboardItem', async () => {
            const harness = setupClipboard();
            try {
                const item = new ClipboardItemImpl({
                    'text/plain': 'plain value',
                    'text/html': new Blob(['<b>rich value</b>'], { type: 'text/html' }),
                });
                await new ClipboardImpl().write([item]);
                expect(harness.written.get('text/plain')).toBe('plain value');
                expect(harness.written.get('text/html')).toBe('<b>rich value</b>');
            } finally {
                harness.teardown();
            }
        });

        it('write rejects formats that cannot travel through execCommand', async () => {
            const harness = setupClipboard();
            try {
                const item = new ClipboardItemImpl({ 'image/png': new Blob([''], { type: 'image/png' }) });
                await expectAsync(new ClipboardImpl().write([item])).toBeRejectedWithError(DOMException, /not supported/);
            } finally {
                harness.teardown();
            }
        });

        it('read returns a ClipboardItem holding the clipboard formats', async () => {
            const harness = setupClipboard();
            harness.system.set('text/plain', 'plain value');
            harness.system.set('text/html', '<b>rich value</b>');
            try {
                const [item] = await new ClipboardImpl().read();
                expect(item.types).toEqual(['text/plain', 'text/html']);
                expect(await (await item.getType('text/html')).text()).toBe('<b>rich value</b>');
            } finally {
                harness.teardown();
            }
        });

        it('read always reports a plain text format', async () => {
            const harness = setupClipboard();
            try {
                const [item] = await new ClipboardImpl().read();
                expect(item.types).toEqual(['text/plain']);
                expect(await (await item.getType('text/plain')).text()).toBe('');
            } finally {
                harness.teardown();
            }
        });
    });

    describe('ClipboardItemImpl', () => {
        it('exposes the types it was created with', async () => {
            const item = new ClipboardItemImpl({ 'text/plain': 'plain value' });
            expect(item.types).toEqual(['text/plain']);
            expect(item.presentationStyle).toBe('unspecified');
            expect(await (await item.getType('text/plain')).text()).toBe('plain value');
        });

        it('rejects with NotFoundError for an unknown type', async () => {
            const item = new ClipboardItemImpl({ 'text/plain': 'plain value' });
            await expectAsync(item.getType('text/html')).toBeRejectedWithError(DOMException, /was not found/);
        });

        it('throws when constructed without any format', () => {
            expect(() => new ClipboardItemImpl({})).toThrowError(TypeError, /Empty dictionary argument/);
        });

        it('reports the formats the shim supports', () => {
            expect(ClipboardItemImpl.supports('text/plain')).toBeTrue();
            expect(ClipboardItemImpl.supports('text/html')).toBeTrue();
            expect(ClipboardItemImpl.supports('image/png')).toBeFalse();
        });
    });
});
