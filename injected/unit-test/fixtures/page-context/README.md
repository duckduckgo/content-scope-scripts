# Page Context DOM-to-Markdown Tests

This directory contains test fixtures for testing the `domToMarkdown` function from `page-context.js`.

## Directory Structure

- `output/` - Generated markdown files from test runs (temporary, regenerated on each run)
- `expected/` - Expected markdown output files (committed to git)

## How It Works

The test suite (`page-context-dom.spec.js`) does the following:

1. **Creates test cases** with HTML snippets and settings for `domToMarkdown`
2. **Converts HTML to Markdown** using JSDom to simulate a browser environment
3. **Writes output** to `output/` directory for inspection
4. **Compares output** with expected files in `expected/` directory
5. **Fails if different** - Any difference between output and expected causes test failure

## Test Cases

The suite includes 20 test cases covering:

- Basic HTML elements (paragraphs, headings, lists, links, images)
- Formatting (bold, italic, mixed formatting)
- Complex structures (nested lists, articles, blog posts)
- Edge cases (hidden content, empty links, whitespace handling)
- Configuration options (max length truncation, excluded selectors, trim blank links)

## Updating Expected Output

When the `domToMarkdown` function behavior changes:

1. Review the changes in `output/` directory
2. If changes are correct, copy them to `expected/`:
   ```bash
   cp unit-test/fixtures/page-context/output/*.md unit-test/fixtures/page-context/expected/
   ```
3. Commit the updated expected files

## Running Tests

```bash
npm run test-unit -- unit-test/page-context-dom.spec.js
```

## Why This Approach?

- **Visibility**: Output files make it easy to review markdown generation
- **Regression detection**: Tests fail on any unintended changes
- **Documentation**: Expected files serve as examples of the function's behavior
- **Easy updates**: Simple to update baselines when behavior intentionally changes

