import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    base64ByteLength,
    formatFileSize,
    getDomainForDisplay,
    splitFileName,
} from '../components/chat-tools/attachments/attachmentText.js';

test.describe('formatFileSize', () => {
    test('formats bytes, KB, MB and GB', () => {
        equal(formatFileSize(0), '0 B');
        equal(formatFileSize(1023), '1023 B');
        equal(formatFileSize(1024), '1 KB');
        equal(formatFileSize(1536), '1.5 KB');
        equal(formatFileSize(1.4 * 1024 * 1024), '1.4 MB');
        equal(formatFileSize(12.6 * 1024 * 1024), '13 MB');
        equal(formatFileSize(3 * 1024 * 1024 * 1024), '3 GB');
    });

    test('caps the unit at GB', () => {
        equal(formatFileSize(5000 * 1024 * 1024 * 1024), '5000 GB');
    });
});

test.describe('splitFileName', () => {
    test('splits stem and extension', () => {
        deepEqual(splitFileName('q3-report.pdf'), { stem: 'q3-report', extension: '.pdf' });
        deepEqual(splitFileName('archive.tar.gz'), { stem: 'archive.tar', extension: '.gz' });
    });

    test('returns an empty extension for dotfiles and extensionless names', () => {
        deepEqual(splitFileName('README'), { stem: 'README', extension: '' });
        deepEqual(splitFileName('.env'), { stem: '.env', extension: '' });
        deepEqual(splitFileName('trailing.'), { stem: 'trailing.', extension: '' });
    });
});

test.describe('base64ByteLength', () => {
    test('accounts for padding', () => {
        equal(base64ByteLength(''), 0);
        equal(base64ByteLength(btoa('a')), 1);
        equal(base64ByteLength(btoa('ab')), 2);
        equal(base64ByteLength(btoa('abc')), 3);
        equal(base64ByteLength(btoa('hello world')), 11);
    });
});

test.describe('getDomainForDisplay', () => {
    test('returns the host without a leading www', () => {
        equal(getDomainForDisplay('https://www.starbucks.com/menu'), 'starbucks.com');
        equal(getDomainForDisplay('https://developer.mozilla.org/en-US/'), 'developer.mozilla.org');
        equal(getDomainForDisplay('example.com/path'), 'example.com');
    });

    test('falls back to the raw string when there is no host', () => {
        equal(getDomainForDisplay('about:blank'), 'about:blank');
        equal(getDomainForDisplay(''), '');
    });
});
