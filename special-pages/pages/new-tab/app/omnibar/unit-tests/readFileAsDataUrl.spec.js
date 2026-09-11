import { equal, rejects } from 'node:assert/strict';
import { test } from 'node:test';
import { readFileAsDataUrl, FILE_READ_TIMEOUT } from '../components/chat-tools/attachments/readFileAsDataUrl.js';

/** @type {typeof globalThis.FileReader | undefined} */
let originalFileReader;

test.beforeEach(() => {
    originalFileReader = globalThis.FileReader;
});

test.afterEach(() => {
    if (originalFileReader) {
        globalThis.FileReader = originalFileReader;
    } else {
        // @ts-expect-error - restoring undefined
        delete globalThis.FileReader;
    }
});

test('readFileAsDataUrl resolves with the FileReader result', async () => {
    class MockFileReader {
        /** @type {string | ArrayBuffer | null} */
        result = 'data:application/pdf;base64,JVBERi0=';
        /** @type {(() => void) | null} */
        onload = null;
        /** @type {(() => void) | null} */
        onerror = null;

        readAsDataURL() {
            queueMicrotask(() => this.onload?.());
        }

        abort() {}
    }

    globalThis.FileReader = MockFileReader;

    const file = new File(['%PDF-1.4'], 'sample.pdf', { type: 'application/pdf' });
    const result = await readFileAsDataUrl(file, 1000);
    equal(result, 'data:application/pdf;base64,JVBERi0=');
});

test('readFileAsDataUrl rejects when FileReader errors', async () => {
    class MockFileReader {
        /** @type {(() => void) | null} */
        onload = null;
        /** @type {(() => void) | null} */
        onerror = null;

        readAsDataURL() {
            queueMicrotask(() => this.onerror?.());
        }

        abort() {}
    }

    globalThis.FileReader = MockFileReader;

    const file = new File(['broken'], 'broken.pdf', { type: 'application/pdf' });
    await rejects(readFileAsDataUrl(file, 1000), /Failed to read file/);
});

test('readFileAsDataUrl rejects when reading exceeds the timeout', async () => {
    class MockFileReader {
        /** @type {(() => void) | null} */
        onload = null;
        /** @type {(() => void) | null} */
        onerror = null;
        /** @type {boolean} */
        aborted = false;

        readAsDataURL() {}

        abort() {
            this.aborted = true;
        }
    }

    globalThis.FileReader = MockFileReader;

    const file = new File(['%PDF-1.4'], 'slow.pdf', { type: 'application/pdf' });
    await rejects(readFileAsDataUrl(file, 20), /File reading timed out after 0\.02 seconds/);
    equal(FILE_READ_TIMEOUT, 30000);
});
