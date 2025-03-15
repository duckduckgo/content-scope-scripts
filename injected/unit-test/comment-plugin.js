import { convertToLegalComments } from '../scripts/utils/comment-plugin.js';

describe('convertToLegalComments', () => {
    it('should convert matching comments to legal comments', () => {
        const source = '// Copyright\n// All rights reserved\n// 2024';
        const regex = /\/\/\s*Copyright/;
        const expected = '//! Copyright\n//! All rights reserved\n//! 2024';

        expect(convertToLegalComments(source, regex)).toBe(expected);
    });

    it("should not convert comments that don't match the regex", () => {
        const source = '// Regular comment\n// Another comment';
        const regex = /\/\/\s*License/;

        expect(convertToLegalComments(source, regex)).toBe(source);
    });

    it('should stop converting when encountering non-comment line', () => {
        const source = '// Copyright\n// All rights reserved\ncode line\n// Regular comment';
        const regex = /\/\/\s*Copyright/;
        const expected = '//! Copyright\n//! All rights reserved\ncode line\n// Regular comment';

        expect(convertToLegalComments(source, regex)).toBe(expected);
    });

    it('should handle empty string input', () => {
        const regex = /\/\/\s*Copyright/;

        expect(convertToLegalComments('', regex)).toBe('');
    });

    it('should handle multiple comment blocks', () => {
        const source = '// Copyright\n// Notice\ncode\n// Copyright\n// Notice';
        const regex = /\/\/\s*Copyright/;
        const expected = '//! Copyright\n//! Notice\ncode\n//! Copyright\n//! Notice';

        expect(convertToLegalComments(source, regex)).toBe(expected);
    });

    it('should preserve leading spaces in comments', () => {
        const source = '//    Copyright\n//   All rights reserved';
        const regex = /\/\/\s*Copyright/;
        const expected = '//!    Copyright\n//!   All rights reserved';

        expect(convertToLegalComments(source, regex)).toBe(expected);
    });
});
