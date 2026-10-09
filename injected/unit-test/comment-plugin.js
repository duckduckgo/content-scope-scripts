import { convertToLegalComments, stripComments } from '../scripts/utils/comment-plugin.js';

describe('convertToLegalComments', () => {
    it('should convert single line comments with copyright', () => {
        const input = `// This is a copyright notice
const foo = 'bar';`;

        const expected = `//! This is a copyright notice
const foo = 'bar';`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should convert multiple consecutive line comments following a copyright line', () => {
        const input = `// This is a copyright notice
// This is a second line
// This is a third line
const foo = 'bar';`;

        const expected = `//! This is a copyright notice
//! This is a second line
//! This is a third line
const foo = 'bar';`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should stop converting after a non-comment line is encountered', () => {
        const input = `// This is a copyright notice
// This is a second line
const foo = 'bar';
// This is a regular comment that should not be converted`;

        const expected = `//! This is a copyright notice
//! This is a second line
const foo = 'bar';
// This is a regular comment that should not be converted`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle multiple separate comment blocks', () => {
        const input = `// This is a regular comment
const a = 1;

// This has copyright info
// And continues here
const b = 2;

// Another copyright notice
// With more details
// And even more info
const c = 3;`;

        const expected = `// This is a regular comment
const a = 1;

//! This has copyright info
//! And continues here
const b = 2;

//! Another copyright notice
//! With more details
//! And even more info
const c = 3;`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle indented comments', () => {
        const input = `function test() {
    // This has copyright info
    // This is indented
    return true;
}`;

        const expected = `function test() {
    //! This has copyright info
    //! This is indented
    return true;
}`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle block comments with copyright', () => {
        const input = `/* This is a copyright block comment */
const foo = 'bar';

/* This is a regular
   multiline comment */`;

        const expected = `/*! This is a copyright block comment */
const foo = 'bar';

/* This is a regular
   multiline comment */`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle mixed comment types', () => {
        const input = `// This has copyright info
// This continues
/* This is a regular block comment */
const foo = 'bar';

/* This is a copyright block comment */
// This is a regular comment after a block`;

        const expected = `//! This has copyright info
//! This continues
/* This is a regular block comment */
const foo = 'bar';

/*! This is a copyright block comment */
// This is a regular comment after a block`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle block comments breaking line comment sequences', () => {
        const input = `// This has copyright info
// This line should be converted
/* This block comment breaks the sequence */
// This line should NOT be converted
// Even though it follows another comment`;

        const expected = `//! This has copyright info
//! This line should be converted
/* This block comment breaks the sequence */
// This line should NOT be converted
// Even though it follows another comment`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle case insensitivity for "copyright"', () => {
        const input = `// This has COPYRIGHT info
// This continues
const foo = 'bar';

// This has Copyright mixed case
// More comments
const baz = 'qux';`;

        const expected = `//! This has COPYRIGHT info
//! This continues
const foo = 'bar';

//! This has Copyright mixed case
//! More comments
const baz = 'qux';`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should not convert comments without copyright', () => {
        const input = `// This is a regular comment
// Another regular comment
const foo = 'bar';`;

        const expected = `// This is a regular comment
// Another regular comment
const foo = 'bar';`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should handle code with no comments', () => {
        const input = `const foo = 'bar';
function test() {
  return true;
}
const obj = { key: 'value' };`;

        const expected = input; // Should remain unchanged

        expect(convertToLegalComments(input)).toEqual(expected);
    });

    it('should treat empty lines as non-comment lines that break the sequence', () => {
        const input = `// This has copyright info
// This continues

// These comments should NOT be converted
// Because empty line breaks the sequence
const foo = 'bar';`;

        const expected = `//! This has copyright info
//! This continues

// These comments should NOT be converted
// Because empty line breaks the sequence
const foo = 'bar';`;

        expect(convertToLegalComments(input)).toEqual(expected);
    });
});

describe('stripComments', () => {
    it('should remove comments on their own line, including the line', () => {
        const input = `(() => {
  // src/features/example.js
  /**
   * Docs
   * @param {string} name
   */
  function greet(name) {
    // say hello
    return name;
  }
})();`;

        const expected = `(() => {
  function greet(name) {
    return name;
  }
})();`;

        expect(stripComments(input)).toEqual(expected);
    });

    it('should remove trailing comments and the whitespace before them', () => {
        const input = `const a = 1; // one
const b = 2; /* two */
`;

        const expected = `const a = 1;
const b = 2;
`;

        expect(stripComments(input)).toEqual(expected);
    });

    it('should keep indentation when a comment leads a line', () => {
        const input = `{
    /** @type {number} */ const a = 1;
}`;

        const expected = `{
    const a = 1;
}`;

        expect(stripComments(input)).toEqual(expected);
    });

    it('should keep tokens separated when removing a comment between them', () => {
        expect(stripComments('const a = /* @__PURE__ */ f();')).toEqual('const a = f();');
        expect(stripComments('typeof/**/x;')).toEqual('typeof x;');
        expect(stripComments('a +/**/+b;')).toEqual('a + +b;');
        expect(stripComments('f(/* a */ x, /* b */ y);')).toEqual('f(x,y);');
    });

    it('should keep the line break of a multi-line comment between tokens', () => {
        const input = `function f() { return /*
*/ 1; }`;

        expect(stripComments(input)).toEqual(`function f() { return\n1; }`);
    });

    it('should keep legal comments and directives', () => {
        const input = `/*! © DuckDuckGo */
//! Copyright (C) 2010
/* @license MIT */
// @preserve
const a = 1;
//# sourceURL=example.js`;

        expect(stripComments(input)).toEqual(input);
    });

    it('should not touch comment-like text in strings, templates and regular expressions', () => {
        const input = `const a = '// not a comment';
const b = \`/* not a comment */ \${1 /* comment */}\`;
const c = /\\/\\/ not a comment/;`;

        const expected = `const a = '// not a comment';
const b = \`/* not a comment */ \${1}\`;
const c = /\\/\\/ not a comment/;`;

        expect(stripComments(input)).toEqual(expected);
    });

    it('should handle several comments on one line', () => {
        expect(stripComments('  /* a */ /* b */ x();')).toEqual('  x();');
        expect(stripComments('x(); /* a */ // b\ny();')).toEqual('x();\ny();');
    });
});
