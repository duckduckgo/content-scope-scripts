# Page Context Content Collection

This module provides utilities for collecting web page content using DuckDuckGo's content-scope-scripts page-context feature with Playwright.

## Features

- Extract structured content from web pages (title, headings, links, images, text content)
- Configure content extraction settings (length limits, excluded selectors, etc.)
- Handle content caching and truncation
- Work with the existing fake extension infrastructure

## Quick Start

### Basic Usage

```javascript
import { PageContextCollector, pageContextTest } from './helpers/page-context-collector.js';
import { test } from '@playwright/test';

const testBase = pageContextTest(test);

testBase('collect page content', async ({ page }, testInfo) => {
    const collector = PageContextCollector.create(page, testInfo);
    
    const content = await collector.loadAndCollect('https://example.com');
    
    console.log('Title:', content.title);
    console.log('Content:', content.content);
    console.log('Headings:', content.headings);
});
```

### Advanced Configuration

```javascript
const collector = PageContextCollector.create(page, testInfo);

collector.withPageContextSettings({
    maxContentLength: 5000,
    maxTitleLength: 100,
    excludeSelectors: ['.ad', '.sidebar', '.navigation'],
    subscribeToCollect: { enabled: true },
    cacheExpiration: 30000
});

const content = await collector.loadAndCollect('https://example.com');
```

### Standalone Example

Run the example script to test content extraction:

```bash
cd content-scope-scripts/injected
node integration-test/page-context-example.js https://example.com
```

## API Reference

### PageContextCollector

#### Methods

- `static create(page, testInfo)` - Create a new collector instance
- `withPageContextSettings(options)` - Configure page-context feature settings
- `loadUrl(url)` - Load a URL and initialize page-context
- `collectPageContext()` - Trigger content collection and return results
- `loadAndCollect(url, settings?)` - Load URL and collect content in one step

#### Content Structure

The collected content object contains:

```javascript
{
    title: string,           // Page title
    metaDescription: string, // Meta description
    content: string,         // Main content as markdown
    truncated: boolean,      // Whether content was truncated
    fullContentLength: number, // Original content length
    headings: Array<{level: number, text: string}>,
    links: Array<{text: string, href: string}>,
    images: Array<{src: string, alt: string}>,
    favicon: string,         // Favicon URL
    url: string,            // Page URL
    timestamp: number       // Collection timestamp
}
```

#### Configuration Options

```javascript
{
    subscribeToCollect: { enabled: boolean },
    subscribeToHashChange: { enabled: boolean },
    subscribeToPageShow: { enabled: boolean },
    subscribeToVisibilityChange: { enabled: boolean },
    maxContentLength: number,        // Default: 9500
    maxTitleLength: number,          // Default: 100
    cacheExpiration: number,         // Default: 30000ms
    recheckLimit: number,            // Default: 5
    excludeSelectors: string[]       // CSS selectors to exclude
}
```

## Testing

Run the Playwright tests:

```bash
cd content-scope-scripts/injected
npm run playwright -- page-context-collection.spec.js
```

## Implementation Details

The implementation leverages:

- Content-scope-scripts' existing `page-context` feature
- Playwright's browser extension support via the fake extension
- The `simulateSubscriptionMessage` testing utility
- Direct messaging without requiring background scripts

The page-context feature automatically:
- Converts DOM content to markdown format
- Handles content truncation and caching
- Extracts structured data (headings, links, images)
- Respects visibility and exclusion rules
- Provides performance monitoring
