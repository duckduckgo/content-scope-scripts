import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import { resolveFileMimeType } from '../components/chat-tools/tab-attachment/fileChannels.js';

const pdfAllowList = ['application/pdf'];

test.describe('resolveFileMimeType', () => {
    test('returns the file type when it is on the allow-list', () => {
        const file = new File(['%PDF-1.4'], 'report.pdf', { type: 'application/pdf' });
        equal(resolveFileMimeType(file, pdfAllowList), 'application/pdf');
    });

    test('falls back to the .pdf extension when the browser omits File.type', () => {
        const file = new File(['%PDF-1.4'], 'report.pdf', { type: '' });
        equal(resolveFileMimeType(file, pdfAllowList), 'application/pdf');
    });

    test('matches extension case-insensitively', () => {
        const file = new File(['%PDF-1.4'], 'REPORT.PDF', { type: '' });
        equal(resolveFileMimeType(file, pdfAllowList), 'application/pdf');
    });

    test('returns null for unsupported MIME types and extensions', () => {
        const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
        equal(resolveFileMimeType(file, pdfAllowList), null);
    });
});
