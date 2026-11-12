import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import { resolveFileMimeType } from '../components/chat-tools/tab-attachment/fileChannels.js';

const PDF_ALLOW = ['application/pdf'];

test.describe('resolveFileMimeType', () => {
    test('returns the file type when it is on the allow-list', () => {
        const file = new File(['%PDF'], 'report.pdf', { type: 'application/pdf' });
        equal(resolveFileMimeType(file, PDF_ALLOW), 'application/pdf');
    });

    test('falls back to the .pdf extension when WebKit leaves File.type empty', () => {
        const file = new File(['%PDF'], 'q3-report.pdf', { type: '' });
        equal(resolveFileMimeType(file, PDF_ALLOW), 'application/pdf');
    });

    test('matches extension case-insensitively', () => {
        const file = new File(['%PDF'], 'Q3-REPORT.PDF', { type: '' });
        equal(resolveFileMimeType(file, PDF_ALLOW), 'application/pdf');
    });

    test('returns null for unsupported types and extensions', () => {
        const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
        equal(resolveFileMimeType(file, PDF_ALLOW), null);
    });

    test('returns null when the allow-list is empty', () => {
        const file = new File(['%PDF'], 'report.pdf', { type: 'application/pdf' });
        equal(resolveFileMimeType(file, []), null);
    });

    test('prefers an explicit matching MIME type over extension inference', () => {
        const file = new File(['%PDF'], 'report.pdf', { type: 'application/pdf' });
        deepEqual(resolveFileMimeType(file, ['application/pdf', 'text/plain']), 'application/pdf');
    });
});
